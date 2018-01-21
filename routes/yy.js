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

//playType 根据直播类别获取更多的moreID
router.get('/playType/:type1', (req, res) => {
    const result = res
    let playType = req.params.type1
    superagent
        .get('http://www.yy.com/' + playType + '/')
        .end(function(req, res) {
            const $ = cheerio.load(res.text)
            let items = []
            $(".container .w-video-module-column").each(function(idx, element) {
                let $element = $(element)
                items.push({
                    title: $element.attr('data-stat-name'),
                    moreID: $element.attr('data-stat-bak3'),
                    biz: $('.wrapper').attr('data-stat-bak1')
                })
            })
            result.send(items)
        })
})

//paylist 根据类别ID获取更多播单列表
router.get('/playlist/:type1/:type2/:yyID/:page', (req, res) => {
    const result = res;
    let type1 = req.params.type1;
    let type2 = req.params.type2;
    let yyID = req.params.yyID;
    let page = req.params.page;
    superagent
        .get('http://www.yy.com/more/page.action?biz=' + type1 + '&subBiz=' + type2 + '&page=' + page + '&moduleId=' + yyID)
        .end(function (err, res) {
            let array = JSON.parse(res.text).data.data;
            let idArray = [];
            for (let i = 0; i < array.length; i++) {
                idArray.push({"sid": array[i].sid, "uid": array[i].uid})
            }
            result.send(idArray)
        })
});

//infoList 根据uid sid subid 获取主播的logo和yynum
router.get('/infoList/:uid/:sid/:subid', (req, res) => {
    const result = res
    let uid = req.params.uid
    let sid = req.params.sid
    let subid = req.params.subid
    let infoList = []
    superagent
        .get('http://www.yy.com/live/detail?uid=' + uid + '&sid=' + sid + '&ssid=' + subid)
        .end(function(req, res) {
            let data = JSON.parse(res.text)
            infoList.push({
                logo: data.data.logo,
                yynum: data.data.yynum
            })
            result.send(infoList)
        })
})

//uInfo 根据yynum获取直播的信息
router.get('/uInfo/:yynum', (req, res) => {
    const result = res
    let yynum = req.params.yynum
    superagent
        .get('http://www.yy.com/u/' + yynum)
        .end(function(req, res) {
            const $ = cheerio.load(res.text)
            // basic
            let basic = []
            $('.basic').each(function(idx, element) {
                let $element = $(element)
                for(let i=0;i<$element.children().length;i++){
                    basic.push($element.children('span').eq(i).text())
                }
            });
            // tab标签
            let tag = []
            $('.tag').each(function(idx, element){
                let $element = $(element)
                for(let i=0;i<$element.children().length;i++){
                    tag.push($element.children('a').eq(i).text())
                }
            })
            let uInfo = {
                avator: $('.avatar').attr('src'),
                name: $('.nick').text(),
                basic: basic,
                tag: tag,
                fensNum: $('.user-head-tab').children('a').eq(0).children('span').text()
            }
            result.send(uInfo)
        })
})

//introduce 根据yynum获取主播简介
router.get('/yy/introduce/:yynum', (req, res) => {
    const result = res
    let yynum = req.params.yynum
    superagent
        .get('http://www.yy.com/u/wiki/data/'+yynum)
        .end(function(req, res) {
            let data = JSON.parse(res.text)
            let introduce = {
                summary: data.data.summary
            }
            result.send(introduce)
        })
})

//photoInfo 根据yynum获取相册 albumId 和相册名
router.get('/photoInfo/:yynum', (req, res) => {
    const result = res
    let yynum = req.params.yynum
    superagent
        .get('http://www.yy.com/u/photo/albums/data/' + yynum)
        .end(function(req, res) {
            let data = JSON.parse(res.text)
            let photoInfo = []
            for(let i=0;i<data.data.albums.length;i++){
                photoInfo.push({
                    albumId: data.data.albums[i].albumId,
                    albumName: data.data.albums[i].albumName,
                    photoCount: data.data.albums[i].photoCount
                })
            }
            result.send(photoInfo)
        })
})

//photoList 根据主播 yynum 和相册 albumId 获取相册列表
router.get('/photoList/:albumId/:yynum', (req, res) => {
    const result = res
    let albumId = req.params.albumId
    let yynum = req.params.yynum
    superagent
        .get('http://www.yy.com/u/photo/albums/' + albumId + '/' + yynum + '/1/1000')
        .end(function(req, res) {
            let data = JSON.parse(res.text)
            let photoList = {
                photo: data.photoPage.result
            }
            result.send(photoList)
        })
})

//由sid和ssid查找topCid和subCid
router.get('/liveRoom/:sid/:limit', (req, res) => {
    const result = res
    let sid = req.params.sid
    let limit = req.params.limit
    superagent
        .get('http://wap.yy.com/mobileweb/play/checkChannelOnline?sid=22490906&ssid=22490906')
        .end(function(req, res) {
            let data = JSON.parse(res.text)
            var nobleList = []
            nobleList.push({
                nobleList: data.data.nobleList
            })
            result.send(nobleList)
        })
})

// 根据sid进入直播间 获取直播间贵宾席
router.get('/liveRoom/:sid/:limit', (req, res) => {
    const result = res
    let sid = req.params.sid
    let limit = req.params.limit
    superagent
    .get('http://www.yy.com/ent/room/queryNoble.action?topCid=' + sid + '&subCid=' + sid + '&limit=' + limit)
    .end(function(req, res) {
        let data = JSON.parse(res.text)
        var nobleList = []
        nobleList.push({
            nobleList: data.data.nobleList
        })
        result.send(nobleList)
    })
})

// 在线人(uidarray内容为在线人的uid,可很多个)
router.get('/bangTabZx', (req, res) => {
    const result = res
    superagent
        .get('http://www.yy.com/yyweb/user/queryUserInfos.json?uidarray=[1266286077%2C1722442951]')
        .end(function(req, res) {
            let onlineList = []
            onlineList = JSON.parse(res.text).data
            result.send(onlineList)
        })
})

// 获取直播间信息(姓名，直播描述，在线人数)
router.get('/liveInfo/:sid/:ssid', (req, res) => {
    const result = res
    let sid = req.params.sid
    let ssid = req.params.ssid
    superagent
        .get('http://wap.yy.com/mobileweb/play/liveinfo?sid= '+ sid +' &ssid=' + ssid)
        .end(function(req, res) {
            let data = JSON.parse(res.text)
            var liveInfo = []
            liveInfo.push({
                data: data.data
            })
            result.send(liveInfo)
        })
})


// 贡献榜暂时找不到
module.exports = router
