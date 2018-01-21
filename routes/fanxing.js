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
//获取直播分类
//繁星的直播分类比较复杂
// 1.热门（1-0-0-1-0  page-0-0-1-0） -------参数无法获取
router.get('/hotListFir/:typeid', (req, res) => {
  const result = res
  let typeid = req.params.typeid
  superagent
      .get('http://apibj.fanxing.kugou.com/VServices/IndexService.IndexService.getLiveRoomListByType/'+typeid+'/')
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let regExp = /\(.*\)/
        let array=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data.list
        let idArray=[];
        for(let i=0;i<array.length;i++){
          idArray.push({'roomId':array[i].roomId,'userId':array[i].userId})
        }
        result.send(idArray)
      })
})
//2.女神（20-1-20/  20-page-20/） 男神 (21-1-20/  21-page-20/)  好声音(19-1-20/  19-page-20/)  -------参数无法获取
router.get('/hotListSec/:typeid', (req, res) => {
  const result = res
  let typeid = req.params.typeid
  superagent
      .get('http://visitor.fanxing.kugou.com/VServices/IndexService.IndexService.getRoomListByTagsId/'+typeid+'/')
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let regExp = /\(.*\)/
        let array=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data
        let idArray=[];
        for(let i=0;i<array.length;i++){
          idArray.push({'roomId':array[i].roomId,'userId':array[i].userId})
        }
        result.send(idArray)
      })
})
//3.推荐(getHotStarList)  新秀(getNewStarList)
router.get('/hotListThi/:typeid', (req, res) => {
  const result = res
  let typeid = req.params.typeid
  superagent
      .get('http://visitor.fanxing.kugou.com/VServices/IndexService.IndexService.'+typeid+'/')
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let regExp = /\(.*\)/
        let array=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data
        let idArray=[];
        for(let i=0;i<array.length;i++){
          idArray.push({'roomId':array[i].roomId,'userId':array[i].userId})
        }
        result.send(idArray)
      })
})
//4.手机直播
router.get('/hotListFou/:page/:limit', (req, res) => {
  const result = res
  let page = req.params.page
  let limit = req.params.limit
  superagent
      .get('https://fx.service.kugou.com/mps-web/cdn/mobileLive/roomList_v2?pid=85&version=1234&pageNum='+page+'&pageSize='+limit+'&jsonpcallback=jsonpcallback_httpsfxservicekugoucommpswebcdnmobileLiveroomList_v2pid85version1234pageNum1pageSize20')
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let regExp = /\(.*\)/
        let array=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data.liveStarTypeList
        let idArray=[];
        for(let i=0;i<array.length;i++){
          idArray.push({'roomId':array[i].roomId,'userId':array[i].userId})
        }
        result.send(idArray)
      })
})
//主播直播间获取姓名，图标，观众数，管理数，工会（星光数找不到？？？？？）
router.get('/message/:roomId/:userId', (req, res) => {
  const result = res
  let roomId = req.params.roomId
  let userId = req.params.userId
  superagent
      .get('http://visitor.fanxing.kugou.com/VServices/RoomService.RoomService.getStarInfo/'+userId+'/')
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let regExp = /\(.*\)/
        let str=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data
        superagent
            .get('http://fanxing.kugou.com/index.php?action=clan&id='+str.clanId)
            .end(function(err,res){
              if(err){
                console.error(err)
              }
              const $ = cheerio.load(res.text)
              let clanName=$('.cont').children('h2').text().trim();
              superagent
                  .get('http://visitor.fanxing.kugou.com/VServices/RoomService.RoomService.getViewerList/'+roomId+'-'+userId+'/')
                  .end(function(err,res){
                    if(err){
                      console.error(err)
                    }
                    let regExp = /\(.*\)/
                    let str2=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data
                    result.send({'name':str.nickName,'avatar':str.userLogo,'fansCount':str.fansCount,'clan':clanName,'viewer':str2.count,'admin':str2.admin.length})
                  })
            })
      })
})
//获取主播所收到的礼物
router.get('/gifts/:userId', (req, res) => {
  const result = res
  let userId = req.params.userId
  superagent
      .get('http://visitor.fanxing.kugou.com/VServices/GiftService.GiftService.getLiveGiftList/'+userId)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let regExp = /\(.*\)/
        let gifts=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data
        result.send(gifts)
      })
})
//获取正在观看的观众及管理数
router.get('/viewers/:roomId/:userId', (req, res) => {
  const result = res
  let roomId = req.params.roomId
  let userId = req.params.userId
  superagent
      .get('http://visitor.fanxing.kugou.com/VServices/RoomService.RoomService.getViewerList/'+roomId+'-'+userId+'/')
      .end(function(err,res) {
        if (err) {
          console.error(err)
        }
        let regExp = /\(.*\)/
        let str=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data
        let viewArray=[]
        let adminArray=[]
        for(let i=0;i<str.list.length;i++){
          viewArray.push({'username':str.list[i].nickname,'userlogo':str.list[i].userlogo})
        }
        for(let j=0;j<str.admin.length;j++){
          adminArray.push({'username':str.admin[j].nickname,'userlogo':str.admin[j].userlogo})
        }
        result.send({'viewerlist':viewArray,'adminlist':adminArray,'viewnum':str.count,'adminnum':adminArray.length})
      })
})
//星粉榜活跃度
router.get('/starFansRank/:userId', (req, res) => {
  const result = res
  let userId = req.params.userId
  superagent
      .get('http://visitor.fanxing.kugou.com/VServices/StarFans.StarFansService.getFansRankList/'+userId+'/')
      .end(function(err,res) {
        if (err) {
          console.error(err)
        }
        let regExp = /\(.*\)/
        let str=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data
        let starFansArray=[]
        for(let i=0;i<str.length;i++){
          starFansArray.push({'username':str[i].nickName,'userlogo':str[i].userLogo,'useractivity':str[i].activity})
        }
        result.send(starFansArray)
      })
})
//获取小时榜
router.get('/roomRankList/:roomId', (req, res) => {
  const result = res
  let roomId = req.params.roomId
  superagent
      .get('http://act.fanxing.kugou.com/api/hourlyrank/getRoomRankList?args=['+roomId+']')
      .end(function(err,res) {
        if (err) {
          console.error(err)
        }
        let array=JSON.parse(res.text).data
        result.send(array)
      })
})
//本场贡献榜
router.get('/conList/:roomId', (req, res) => {
  const result = res
  let roomId = req.params.roomId
  superagent
      .get('http://service.fanxing.kugou.com/ranking/room/liveFans.jsonp?rid='+roomId)
      .end(function(err,res) {
        if (err) {
          console.error(err)
        }
        result.send(res.text)
      })
})

//30天贡献榜
router.get('/30conList/:userId', (req, res) => {
  const result = res
  let userId = req.params.userId
  superagent
      .get('http://apibj.fanxing.kugou.com/VServices/ChartService.FansService.getThirtydaysFans/'+userId+'/')
      .end(function(err,res) {
        if (err) {
          console.error(err)
        }
        let regExp = /\(.*\)/
        let str=JSON.parse(regExp.exec(res.text)[0].slice(1,-1)).data
        result.send(str)
      })
})
//获取主播的相册
router.get('/photos/:userId/:page', (req, res) => {
  const result = res
  let userId = req.params.userId
  let page = req.params.page
  let urlFormat='http://p3.fx.kgimg.com/v2/fxuseralbum/'
  superagent
      .get('http://fanxing.kugou.com/index.php?action=photoAlbum&id='+userId+'&page='+page)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        const $ = cheerio.load(res.text)
        let photos=[];
        $('.pic').each(function(idx,element){
          let $element=$(element);
          photos.push(urlFormat+$element.children('a').attr('title'))
        })
        result.send(photos)
      })
})

module.exports = router