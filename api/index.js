const axios = require("axios");
const express = require("express");
const cors = require("cors");
const cheerio = require("cheerio");
const { IgApiClient } = require("instagram-private-api");

require("dotenv").config();

const app = express();

app.use(cors());
const ig = new IgApiClient();

app.get("/api/instagram/:username", async (req, res) => {
  const { username } = req.params;

  const id = process.env.ID;
  const pw = process.env.PW;

  if (!id || !pw) {
    return res
      .status(500)
      .json({ error: "Environment variables not set properly" });
  }

  ig.state.generateDevice(id);
  await ig.account.login(id, pw);

  try {
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

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
