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

import YoukuCrawler from '../crawlers/youku'


const router = express.Router()

//paylist 根据用户uid获取播单列表
router.get('/playlist/:ykUID', (req, res) => {
    const result = res
    let ykUID = req.params.ykUID
    superagent
        .get('http://i.youku.com/i/' + ykUID + '/playlists') //这里的URL也可以是绝对路径
        .end(function (req, res) {
            const $ = cheerio.load(res.text)
            let items = []
            $(".albums-list .items .item").each(function (idx, element) {
                let $element = $(element)
                let regExp = /\?f=(\d+)/
                let link = $element.children('.album-cover').children('.album-link').attr('href')
                items.push({
                    id: regExp.exec(link)[1],
                    link: link
                })
            })
            result.send(items)
        })
});

//listinfo 根据用户listID获取播单详情
router.get('/listinfo/:listID', (req, res) => {
    const result = res
    let listID = req.params.listID

    //获取播单详情
    superagent
        .get('http://list.youku.com/albumlist/show/id_' + listID + '.html')
        .end(function (req, res) {
            const $ = cheerio.load(res.text)
            let listInfo = {
                title: $('.pl-info').children('.pl-title').text(),
                exp: $('.pl-info').children('.intro').text()
            }
            result.send(listInfo)
        })
});

//videolist 根据播单id获取视频列表
router.get('/videolist/:listID/:page', (req, res) => {
    const result = res
    let listID = req.params.listID
    let page = req.params.page
    superagent
        .get('http://list.youku.com/albumlist/show/id_' + listID + '.html?page=' + page)
        .end(function (req, res) {
            const $ = cheerio.load(res.text)
            let items = []
            $("#playList .p-list").each(function (idx, element) {
                let $element = $(element)
                let idRegExp = /v_show\/id_(.+)\.html/
                let link = $element.children('.p-thumb').children('a').attr('href')
                items.push({
                    id: idRegExp.exec(link)[1],
                    title: $element.children('.info-list').children('.title').children('a').text(),
                    length: $element.children('.p-info').children('.status').children('.p-time').children('span').text(),
                    cover: $element.children('.p-thumb').children('img').attr('src')
                })
            })
            result.send(items)
        })
});

//关键词搜索搜索
router.get('/search/:keyword/:page', (req, res) => {
    const result = res
    let keyword = encodeURI(req.params.keyword)
    //let keyword = req.params.keyword
    let page = req.params.page
    let str = 'http://www.soku.com/search_video/q_' + keyword + '_orderby_1_limitdate_0?_lg=10&lengthtype=1&page=' + page
    console.log(str)

    superagent
        .get('http://www.soku.com/search_video/q_' + keyword + '_orderby_1_limitdate_0?_lg=10&lengthtype=1&page=' + page)
        .end(function (req, res) {
            if (res.text != null) {
                const $ = cheerio.load(res.text)
                let items = []
                $(".sk-vlist .v").each(function (idx, element) {
                    let $element = $(element)
                    let idRegExp = /v_show\/id_(.+)\.html/
                    let link = $element.children('.v-link').children('a').attr('href')
                    items.push({
                        id: idRegExp.exec(link)[1],
                        title: $element.children('.v-meta').children('.v-meta-title').children('a').attr('title'),
                        length: $element.children('.v-thumb').children('.v-thumb-tagrb').children('.v-time').text(),
                        cover: $element.children('.v-thumb').children('img').attr('src')
                    })
                })
                result.send(items)
            } else {
                result.send('')
            }
        })
});

module.exports = router;
