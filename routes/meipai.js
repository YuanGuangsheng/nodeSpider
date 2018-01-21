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

//live  获取直播主播的userId和其他信息
router.get('/live/:page', (req, res) => {
    const result = res
    let page = req.params.page;
    superagent
        .get('http://www.meipai.com/lives/get_channels_program?page=' + page + '&count=12')
        .end(function(req, res) {
            let list = JSON.parse(res.text)
            let infoList = []
           for(let i=0;i<list.length;i++){
               infoList.push({
                   userId:list[i].live.user.id,
                   screen_name:  list[i].live.user.screen_name,
                   avatar: list[i].live.user.avatar,
                   gender: list[i].live.user.gender,
                   fens: list[i].live.user.followers_count

               })
            }
            result.send(infoList)
        })
})

// introduction 获取主播的个人简介
router.get('/user/:uId', (req, res) => {
    const result = res
    let uId = req.params.uId;
    superagent
        .get('http://www.meipai.com/user/' + uId)
        .end(function(req, res) {
            const $ = cheerio.load(res.text)
            let introduction = {
                descript: $('.user-descript').text()
            }
            result.send(introduction)
        })
})

module.exports = router