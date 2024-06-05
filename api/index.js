const axios = require("axios");
const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");
const { IgApiClient } = require("instagram-private-api");

require("dotenv").config();

const app = express();

app.use(cors());
const ig = new IgApiClient();

const accounts = [
  { id: process.env.ID1, pw: process.env.PW1 },
  { id: process.env.ID2, pw: process.env.PW2 },
  { id: process.env.ID3, pw: process.env.PW3 },
  { id: process.env.ID4, pw: process.env.PW4 },
  { id: process.env.ID5, pw: process.env.PW5 },
  { id: process.env.ID6, pw: process.env.PW6 },
];

let currentAccountIndex = 0;

async function rotateAccount() {
  currentAccountIndex = (currentAccountIndex + 1) % accounts.length;
  const { id, pw } = accounts[currentAccountIndex];
  await login(id, pw);
}

async function login(id, pw) {
  try {
    await ig.account.login(id, pw);
  } catch (error) {
    console.error(`Failed to log in with account: ${id}`);
    throw error;
  }
}

app.get("/api/instagram/:username", async (req, res) => {
  const { username } = req.params;

  if (!accounts.every((acc) => acc.id && acc.pw)) {
    return res
      .status(500)
      .json({ error: "Environment variables not set properly" });
  }

  try {
    await rotateAccount();

    const userId = await ig.user.getIdByUsername(username);
    const userInfo = await ig.user.info(userId);
    const feeds = await ig.feed.userStory(userId).items();

    userInfo.username = username;
    userInfo.stories = feeds;

    const response = await axios.get(`https://www.instagram.com/${username}/`);
    const $ = cheerio.load(response.data);
    const userImage = $("meta[property='og:image']").attr("content");

    userInfo.profile_pic_url = userImage;

    res.json({
      userInfo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
