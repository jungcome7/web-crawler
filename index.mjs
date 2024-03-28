import axios from "axios";
import cheerio from "cheerio";
import express from "express";
import XLSX from "xlsx";

const log = console.log;
const app = express();

const getHtml = async () => {
  try {
    return await axios.get(
      "https://en.wikipedia.org/wiki/List_of_philosophers_(I%E2%80%93Q)"
    );
  } catch (error) {
    console.error(error);
  }
};

app.get("/home", (request, response) => {
  getHtml().then((html) => {
    const $ = cheerio.load(html.data);
    // console.log($bodyList.text());

    const li = $("ul").find("li");

    const list = [];

    li.each(async (index, elem) => {
      const link = $(elem).find("a").attr("href");

      if (link?.startsWith("/wiki/")) {
        try {
          await axios.get(`https://en.wikipedia.org${link}`).then((html) => {
            const $ = cheerio.load(html.data);

            const infobox = $(".infobox");

            infobox.each((i, elem) => {
              list[index] = {
                name: $(elem).find(".fn").text(),
                image: $(elem).find(".infobox-image").find("img").attr("src"),
              };

              $(elem)
                .find("tr")
                .each((i, elem) => {
                  const key = $(elem)
                    .find(".infobox-label")
                    .text()
                    .toLowerCase()
                    .replace(" ", "_");

                  let value = "";

                  if (key === "notable_work") {
                    let newValue = "";

                    const infoboxDataI = $(elem)
                      .find(".infobox-data")
                      .find("i");

                    infoboxDataI.each((i, elem) => {
                      const addedValue = $(elem).text();

                      newValue +=
                        infoboxDataI.length - 1 === i
                          ? addedValue
                          : addedValue + ", ";
                    });

                    value = newValue;
                  } else if (
                    $(elem).find(".infobox-data").has("li").length > 0
                  ) {
                    let newValue = "";

                    const infoboxDataA = $(elem)
                      .find(".infobox-data")
                      .find("li");

                    infoboxDataA.each((i, elem) => {
                      const addedValue = $(elem)
                        .text()
                        .replace("\n", "")
                        .replace(" ", "")
                        .replace(/\[[1-9][0-9]?\]/g, "");

                      newValue +=
                        infoboxDataA.length - 1 === i
                          ? addedValue
                          : addedValue + ", ";
                    });

                    value = newValue;
                  } else if (key === "spouse" || key === "spouses") {
                    value = $(elem)
                      .find(".marriage-display-ws")
                      .text()
                      .replace("\n", "")
                      .replace(/\[[1-9][0-9]?\]/g, "");
                  } else {
                    value = $(elem)
                      .find(".infobox-data")
                      .text()
                      .replace("\n", "")
                      .replace(/\[[1-9][0-9]?\]/g, "");
                  }

                  list[index][key] = value;
                });
            });
          });

          console.log({ list });
          return list;
        } catch {
          console.log("error");
        }
      }
    });

    setTimeout(() => {
      console.log("how ");
      console.log({ list });
      const ws = XLSX.utils.json_to_sheet(list.filter((item) => item.name));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, "test.xlsx");

      console.log("xlsx created");
    }, 30000);
  });
});

app.listen(8080, () => log("connected"));
