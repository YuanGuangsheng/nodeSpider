/**
 * Created by MM on 2017/6/29.
 */
const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
// const crypto = require('crypto')

const moment = require('moment')
moment.locale('cn')
const debug = require('debug')('api')

const superagent = require('superagent')
const cheerio = require('cheerio')
const mysql = require('mysql')
import Service from '../service'


const router = express.Router()

//****************从排行榜获取数据**********************//
// 获取魅力主播榜
router.get('/charm', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_anchor_gift.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let charmList = resData
        result.send(charmList)
      })
})

// 获取受欢迎主播榜https://www.panda.tv/cmstatic/weekly_rank_anchor_barrage.json
router.get('/popular', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_anchor_gift_user.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let popularList = resData
        result.send(popularList)
      })
})

// 获取弹幕条数榜
router.get('/barrage', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_anchor_barrage.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let barrageList = resData
        result.send(barrageList)
      })
})

// 获取土豪实力榜
router.get('/gift', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_user_gift.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let giftList = resData
        result.send(giftList)
      })
})

// 获取任性新壕友
router.get('/newGift', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_new_user_gift.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let newGiftList = resData
        result.send(newGiftList)
      })
})

// 主播身高榜
router.get('/bamboo', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_anchor_bamboo.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let bambooList = resData
        result.send(bambooList)
      })
})

// 主播敬业榜
router.get('/play', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_anchor_play.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let playList = resData
        result.send(playList)
      })
})
// 主播收视榜
router.get('/viewtime', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_anchor_viewtime.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let viewtimeList = resData
        result.send(viewtimeList)
      })
})
// 新人人气王
router.get('/newPopular', (req, res) => {
  const result = res
  superagent
      .get('https://www.panda.tv/cmstatic/weekly_rank_new_anchor_popular.json')
      .end(function(req, res) {
        let resData = JSON.parse(res.text)
        let newPopularList = resData
        result.send(newPopularList)
      })
})

// 根据主播房间号进入主播房间https://www.panda.tv/55666
router.get('/room/:roomId', (req, res) => {
  const result = res
  let roomId = req.params.roomId;
  superagent
      .get('https://www.panda.tv/' + roomId)
      .end(function(req, res) {
        // const $ = cheerio.load(res.text)
        // do something
      })
})

//获取订阅总数
router.get('/fansnum/:roomId', (req, res) => {
  const result = res
  let roomId = req.params.roomId;
  superagent
      .get('https://www.panda.tv/room_followinfo?roomid=' + roomId)
      .end(function(req, res) {
        let num = JSON.parse(res.text).data.fans
        result.send({'fansnum':num})
      })
})
//获取周榜前10
router.get('/weekList/:hostId', (req, res) => {
  const result = res
  let hostId = req.params.hostId;
  superagent
      .get('https://grank.panda.tv/room_weekly_rank?anchor_id=' + hostId)
      .end(function(req, res) {
        let array = JSON.parse(res.text).data.top10
        result.send(array)
      })
})
//获取总榜前10
router.get('/totalList/:hostId', (req, res) => {
  const result = res
  let hostId = req.params.hostId;
  superagent
      .get('https://grank.panda.tv/room_total_rank?anchor_id=' + hostId)
      .end(function(req, res) {
        let array = JSON.parse(res.text).data.top10
        result.send(array)
      })
})
//礼物暂时找不到
module.exports = router