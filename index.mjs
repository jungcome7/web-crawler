import * as cheerio from "cheerio";

const $ = cheerio.load('<h2 class="title">Hello world</h2>');

console.log($("h2").text());
