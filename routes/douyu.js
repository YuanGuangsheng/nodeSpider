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
//获取斗鱼全部小组
router.get('/peo_list', (req, res) => {
  const result = res
  superagent
      .get('https://yuba.douyu.com/index/allgroup')
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        const $ = cheerio.load(res.text)
        let peo_array=[];
        $('.group-forum').each(function(idx,element){
          if(idx!=0){
            let $element=$(element)
            $element.children('a').each(function(idx2,element2){
              let $element2=$(element2)
              peo_array.push({'href':$element2.attr('href'),'tid':$element2.attr('data-tid')})
            })
          }
        })
        result.send(peo_array);
      })
})

//进入鱼吧，获取相册
router.get('/photos/:href', (req, res) => {
  const result = res
  let href = req.params.href
  superagent
      .get('https://yuba.douyu.com/'+href)
      .set({

      })
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        const $ = cheerio.load(res.text)
        let photos=[]
        $('.photo-card-out').each(function(idx,element){
          let $element=$(element)
          let photo=$element.find('td.center').children('img').attr('src')
          photos.push(photo)
        })
        result.send(photos);
      })
})
module.exports = router