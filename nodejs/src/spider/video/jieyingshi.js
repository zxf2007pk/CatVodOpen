import req from '../../util/req.js';
import { formatPlayUrl, jsonParse } from '../../util/misc.js';
import CryptoJS from 'crypto-js';

const url = 'https://www.hkybqufgh.com';
const key = 'cb808529bae6b6be45ecfab29a4889bc';
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function getHeaders(params = '') {
    const t = new Date().getTime().toString();
    let signParams = params ? `${params}&key=${key}&t=${t}` : `key=${key}&t=${t}`;
    const md5 = CryptoJS.MD5(signParams).toString();
    const sign = CryptoJS.SHA1(md5).toString();

    return {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'sign': sign,
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        't': t,
        'referer': url + '/',
    };
}

async function request(reqUrl, customHeaders = {}) {
    const res = await req.get(reqUrl, {
        headers: {
            "User-Agent": userAgent,
            ...customHeaders
        },
    });
    return res.data;
}

function parseList(html) {
    const videos = [];
    try {
        const vodIdRegex = /\\"vodId\\":(.*?),/g;
        const vodNameRegex = /\\"vodName\\":\\"(.*?)\\"/g;
        const vodPicRegex = /\\"vodPic\\":\\"(.*?)\\"/g;
        const vodRemarksRegex = /\\"vodRemarks\\":\\"(.*?)\\"/g;

        const ids = [...html.matchAll(vodIdRegex)].map(m => m[1]);
        const names = [...html.matchAll(vodNameRegex)].map(m => m[1]);
        const pics = [...html.matchAll(vodPicRegex)].map(m => m[1]);
        const remarks = [...html.matchAll(vodRemarksRegex)].map(m => m[1]);

        for (let i = 0; i < ids.length; i++) {
            videos.push({
                vod_id: ids[i],
                vod_name: names[i],
                vod_pic: pics[i],
                vod_remarks: remarks[i] || '',
            });
        }
    } catch (e) {
        console.error('Parse List Error:', e);
    }
    return videos;
}

async function init(inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    const classes = [
        { type_id: '1', type_name: '电影' },
        { type_id: '2', type_name: '电视剧' },
        { type_id: '4', type_name: '动漫' },
        { type_id: '3', type_name: '综艺' }
    ];
    return {
        class: classes,
        filters: {},
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page || 1;
    
    const reqUrl = `${url}/vod/show/id/${tid}/page/${pg}`;
    const html = await request(reqUrl);
    const videos = parseList(html);

    return {
        page: parseInt(pg),
        pagecount: videos.length === 0 ? pg : parseInt(pg) + 1,
        limit: 20,
        total: 999,
        list: videos,
    };
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const apiUrl = `${url}/api/mw-movie/anonymous/video/detail?id=${id}`;
        const headers = getHeaders(`id=${id}`);
        
        try {
            const res = await request(apiUrl, headers);
            if (res && res.data) {
                const data = res.data;
                let playList = [];
                if (data.episodeList) {
                    for (const ep of data.episodeList) {
                        playList.push(`${ep.name}$${id}-${ep.nid}`);
                    }
                }

                const vod = {
                    vod_id: data.vodId,
                    vod_name: data.vodName,
                    vod_pic: data.vodPic,
                    type_name: data.vodClass,
                    vod_year: data.vodYear,
                    vod_area: data.vodArea,
                    vod_remarks: data.vodRemarks,
                    vod_actor: data.vodActor,
                    vod_director: data.vodDirector,
                    vod_content: data.vodContent,
                    vod_play_from: 'JieYingShi',
                    vod_play_url: playList.join('#')
                };
                videos.push(vod);
            }
        } catch (e) {
            console.error('Detail Error:', e);
        }
    }

    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const idStr = inReq.body.id;
    const info = idStr.split('-');
    const _id = info[0];
    const _nid = info[1];

    const apiUrl = `${url}/api/mw-movie/anonymous/v2/video/episode/url?id=${_id}&nid=${_nid}`;
    const headers = getHeaders(`id=${_id}&nid=${_nid}`);

    try {
        const res = await request(apiUrl, headers);
        if (res && res.data && res.data.list && res.data.list.length > 0) {
            const playUrl = res.data.list[0].url;
            return {
                parse: 0,
                url: playUrl,
                header: {
                    'User-Agent': userAgent
                }
            };
        }
    } catch (e) {
        console.error('Play Error:', e);
    }

    return {
        parse: 0,
        url: 'https://json.doube.eu.org/error/4gtv/index.m3u8',
    };
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page || 1;
    const wd = inReq.body.wd;

    if (parseInt(pg) > 1) {
        return {
            page: pg,
            pagecount: pg,
            list: []
        };
    }

    const reqUrl = `${url}/vod/search/${encodeURIComponent(wd)}`;
    const html = await request(reqUrl);
    const videos = parseList(html);

    return {
        page: 1,
        pagecount: 1,
        list: videos,
    };
}

async function test(inReq, outResp) {
    try {
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.category.list[0].vod_id,
                });
                dataResult.detail = resp.json();
                if (dataResult.detail.list.length > 0) {
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
            wd: '爱',
            page: 1,
        });
        dataResult.search = resp.json();
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'jieyingshi',
        name: '🟢 界影',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};