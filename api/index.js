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

app.get("/api/instagram/:username", async (req, res) => {
  const { username } = req.params;

  const { id, pw } = accounts[Math.floor(Math.random() * accounts.length)];

  if (!id || !pw) {
    return res
      .status(500)
      .json({ error: "Environment variables not set properly" });
  }

  ig.state.generateDevice(id);

  async function login() {
    try {
      await ig.account.login(id, pw);
    } catch (error) {
      if (
        error.name === "IgResponseError" &&
        error.response &&
        error.response.statusCode === 400
      ) {
        console.error("Rate limited, retrying in 60 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 60000)); // 60초 대기
        await login(); // 다시 로그인 시도
      } else {
        throw error; // 다른 오류는 다시 던짐
      }
    }
  }

  try {
    await login();

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
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
