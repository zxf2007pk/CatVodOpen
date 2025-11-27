import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import CryptoJS from 'crypto-js';
import { load } from 'cheerio';

let HOST = 'https://film.symx.club';
let siteKey = '';
let siteType = 0;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';
const GLOBAL_HEADERS = {
    'User-Agent': UA,
    'Accept': 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin'
};

async function request(reqUrl, method = 'get', data = null) {
    let res = await req(reqUrl, {
        method: method,
        headers: GLOBAL_HEADERS,
        data: data
    });
    return res.data;
}

async function init(inReq, outResp) {

    return {}
}

async function home(inReq, outResp) {
    const data = await request(HOST + '/api/category/top');
    let classes = [];
    if (data && data.data) {
        for (const i of data.data) {
            if (i && typeof i === 'object') {
                classes.push({
                    type_id: i.id,
                    type_name: i.name
                });
            }
        }
    }
    return JSON.stringify({
        class: classes,
        filters: {} 
    });
}

async function homeVod(inReq, outResp) {
    const data = await request(HOST + '/api/film/category');
    let videos = [];
    if (data && data.data) {
        for (const i of data.data) {
            const filmList = i.filmList || [];
            for (const j of filmList) {
                videos.push({
                    vod_id: j.id,
                    vod_name: j.name,
                    vod_pic: j.cover,
                    vod_remarks: j.doubanScore || ''
                });
            }
        }
    }
    return JSON.stringify({
        list: videos
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    
    const link = `${HOST}/api/film/category/list?area=&categoryId=${tid}&language=&pageNum=${pg}&pageSize=15&sort=updateTime&year=`;
    const data = await request(link);
    
    let videos = [];
    let total = 0;
    let limit = 15;
    
    if (data && data.data && data.data.list) {
        total = data.data.total || 0;
        for (const i of data.data.list) {
            videos.push({
                vod_id: i.id,
                vod_name: i.name,
                vod_pic: i.cover,
                vod_remarks: i.updateStatus || ''
            });
        }
    }

    const pgCount = Math.ceil(total / limit);
    
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount || 1,
        limit: limit,
        total: total,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const dataRes = await request(`${HOST}/api/film/detail?id=${id}`);
        const data = dataRes.data;
        
        if (data) {
            let vod = {
                vod_id: data.id,
                vod_name: data.name,
                vod_pic: data.cover,
                vod_year: data.year,
                vod_area: data.other, 
                vod_actor: data.actor,
                vod_director: data.director,
                vod_content: data.blurb,
                vod_remarks: data.doubanScore ? `评分:${data.doubanScore}` : '',
            };

            let show = [];
            let play_urls = [];

            if (data.playLineList) {
                for (const i of data.playLineList) {
                    show.push(i.playerName);
                    let lineUrls = [];
                    if (i.lines) {
                        for (const j of i.lines) {

                            lineUrls.push(`${j.name}$${j.id}`);
                        }
                    }
                    play_urls.push(lineUrls.join('#'));
                }
            }

            vod.vod_play_from = show.join('$$$');
            vod.vod_play_url = play_urls.join('$$$');
            videos.push(vod);
        }
    }
    
    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const link = `${HOST}/api/line/play/parse?lineId=${id}`;
    const data = await request(link);
    
    let playUrl = '';
    if (data && data.data) {
        playUrl = data.data;
    }
    
    return JSON.stringify({
        parse: 0,
        url: playUrl,
        header: {
            'User-Agent': UA
        }
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;

    const link = `${HOST}/api/film/search?keyword=${encodeURIComponent(wd)}&pageNum=${pg}&pageSize=10`;
    const data = await request(link);
    
    let videos = [];
    if (data && data.data && data.data.list) {
        for (const i of data.data.list) {
            videos.push({
                vod_id: i.id,
                vod_name: i.name,
                vod_pic: i.cover,
                vod_remarks: i.updateStatus || '',
                vod_year: i.year,

                vod_area: i.area,
                vod_director: i.director
            });
        }
    }
    
    return JSON.stringify({
        list: videos,
        page: parseInt(pg)
    });
}

async function test(inReq, outResp) {
    try {
        const printErr = function (json) {
            if (json.statusCode && json.statusCode == 500) {
                console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr("" + resp.json());
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.category.list[0].vod_id,
                });
                dataResult.detail = resp.json();
                printErr(resp.json());
                if (dataResult.detail.list && dataResult.detail.list.length > 0) {
                    dataResult.play = [];
                    for (const vod of dataResult.detail.list) {
                        const flags = vod.vod_play_from.split('$$$');
                        const ids = vod.vod_play_url.split('$$$');
                        for (let j = 0; j < flags.length; j++) {
                            const flag = flags[j];
                            const urls = ids[j].split('#');
                            for (let i = 0; i < urls.length && i < 2; i++) {
                                resp = await inReq.server
                                    .inject()
                                    .post(`${prefix}/play`)
                                    .payload({
                                        flag: flag,
                                        id: urls[i].split('$')[1],
                                    });
                                dataResult.play.push(resp.json());
                            }
                        }
                    }
                }
            }
        }
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '爱情',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'symx',
        name: '🟢 幕希',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/home_vod', homeVod);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};