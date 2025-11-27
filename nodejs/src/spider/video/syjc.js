import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';

let HOST = 'https://h4ivs.sm431.vip';
let VIDEO_HOST = 'https://m3u8.nl:88';
let IMAGE_HOST = 'https://3334.nl:33';

const UA = 'Mozilla/5.0 (Linux; Android 13; 22127RK46C Build/TKQ1.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/104.0.5112.97 Mobile Safari/537.36';

async function request(reqUrl, method = 'get', data = null) {
    let res = await req(reqUrl, {
        method: method,
        headers: {
            'User-Agent': UA,
            'Referer': HOST,
            'Accept-Language': 'zh-CN,zh;q=0.9'
        },
        data: data
    });
    return res.data;
}

function decrypt(text) {
    if (!text) return "";
    try {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(128 ^ text.charCodeAt(i));
        }
        return result;
    } catch (e) {
        return text;
    }
}

function decryptFromJs(js) {
    const match = js.match(/document\.write\(l\('([^']+)'\)\)/);
    if (match && match[1]) {
        return decrypt(match[1]);
    }
    return "";
}

function formatImgUrl(url) {
    if (!url) return "";
    if (url.startsWith("//")) {
        url = "https:" + url;
    } else if (url.startsWith("/")) {
        url = IMAGE_HOST + url;
    }
    return `${url}@User-Agent=${UA}@Referer=${HOST}/`;
}

function parseList(html) {
    const $ = load(html);
    const items = $('.vodbox, .stui-vodlist__box, .vodlist__box, .video-card, .item');
    let videos = [];
    
    items.each((_, el) => {
        const $el = $(el);
        const $a = $el.is('a') ? $el : $el.find('a').first();
        let href = $a.attr('href');
        
        if (!href) return;
        if (href.startsWith('/')) href = HOST + href;
        
        const vidMatch = href.match(/\/vid\/(\d+)/);
        if (!vidMatch) return;
        const vid = vidMatch[1];
        
        let title = "";
        
        const $p = $el.find('p');
        if ($p.length > 0) {
            const $script = $p.find('script');
            if ($script.length > 0 && $script.html()) {
                title = decryptFromJs($script.html());
            } else {
                title = $p.text().trim();
            }
        }
        
        if (!title) {
            const attrs = ['data-title', 'data-name', 'title'];
            for (const attr of attrs) {
                const val = $el.attr(attr);
                if (val) {
                    const de = decrypt(val);
                    if (de && de.length > 3) {
                        title = de;
                        break;
                    }
                }
            }
        }
        
        if (!title) title = "未知标题";
        
        let img = "";
        const $img = $el.find('img').first();
        if ($img.length > 0) {
            img = $img.attr('data-src') || $img.attr('src') || "";
        }
        if (!img) img = `${IMAGE_HOST}/${vid}.jpg`;
        
        videos.push({
            vod_id: vid,
            vod_name: title,
            vod_pic: formatImgUrl(img),
            vod_remarks: '',
        });
    });
    
    if (videos.length === 0) {
        const regex = /\[]\(\/vid\/(\d+)\.html\)/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            const v = match[1];
            videos.push({
                vod_id: v,
                vod_name: "未知标题",
                vod_pic: formatImgUrl(`${IMAGE_HOST}/${v}.jpg`),
                vod_remarks: ""
            });
        }
    }
    
    return videos;
}

async function init(inReq, outResp) {
    return {};
}

async function home(inReq, outResp) {
    let classes = [
        {"type_name": "国产", "type_id": "1"},
        {"type_name": "日本", "type_id": "2"},
        {"type_name": "韩国", "type_id": "3"},
        {"type_name": "欧美", "type_id": "4"},
        {"type_name": "三级", "type_id": "5"},
        {"type_name": "动漫", "type_id": "6"},
    ];
    return JSON.stringify({
        class: classes,
        filters: {}
    });
}

async function homeVod() {
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;

    let link = "";
    if (tid === "0") {
        link = parseInt(pg) === 1 ? HOST : `${HOST}/page/${pg}.html`;
    } else {
        link = parseInt(pg) === 1 ? `${HOST}/list/${tid}.html` : `${HOST}/list/${tid}/${pg}.html`;
    }

    const html = await request(link);
    const videos = parseList(html);
    
    const $ = load(html);
    let lastPage = pg;
    $("a[href*='list/']").each((_, el) => {
        const href = $(el).attr('href') || "";
        const match = href.match(/\/list\/\d+\/(\d+)\.html/);
        if (match) {
            const p = parseInt(match[1]);
            if (p > lastPage) lastPage = p;
        }
    });

    return JSON.stringify({
        page: parseInt(pg),
        pagecount: parseInt(lastPage),
        limit: 30,
        total: 99999,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const html = await request(`${HOST}/vid/${id}.html`);
        const $ = load(html);

        let title = "";
        
        const pageTitle = $('title').text().trim();
        if (pageTitle) {
            title = pageTitle.replace(/\s*[-_|]\s*.{0,20}$/, '').trim();
        }

        if (!title || title.length < 5) {
            const selectors = ['h1', 'h2', '.video-title', '.title'];
            for (const sel of selectors) {
                const txt = $(sel).first().text().trim();
                if (txt && txt.length > 5) {
                    title = txt;
                    break;
                }
            }
        }
        if (!title) title = `视频${id}`;

        let pic = "";
        const imgSelectors = ['.picbox img', '.vodimg img', '.video-pic img', '.poster img', 'img[data-id]'];
        for (const sel of imgSelectors) {
            const $img = $(sel).first();
            const p = $img.attr('data-src') || $img.attr('src');
            if (p && !p.toLowerCase().includes('favicon')) {
                pic = p;
                break;
            }
        }
        if (!pic) {
            const metaImg = $('meta[property="og:image"]').attr('content');
            if (metaImg) pic = metaImg;
        }
        if (!pic) pic = `${IMAGE_HOST}/${id}.jpg`;

        let desc = $(".vodinfo, .video-info, .content, .intro, .description").first().text().trim();

        const vod = {
            vod_id: id,
            vod_name: title,
            vod_pic: formatImgUrl(pic),
            vod_content: desc,
            vod_play_from: "在线播放",
            vod_play_url: `高清在线$${id}@@0@@1`
        };
        videos.push(vod);
    }
    
    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const idStr = inReq.body.id;
    const vid = idStr.split('@@')[0];
    const playUrl = `${VIDEO_HOST}/${vid}/hls/index.m3u8`;
    
    return JSON.stringify({
        parse: 0,
        url: playUrl,
        header: {
            "User-Agent": UA,
            "Referer": HOST,
            "Accept-Language": "zh-CN,zh;q=0.9",
        }
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    
    const url = `${HOST}/so.html`;
    const params = { wd: wd };
    if (pg > 1) params.page = pg;

    let html = "";
    try {
        let res = await req(url, {
            method: 'get',
            params: params,
            headers: {
                'User-Agent': UA,
                'Referer': HOST
            }
        });
        html = res.data;
    } catch (e) {
        return JSON.stringify({ list: [] });
    }

    const videos = parseList(html);
    
    const $ = load(html);
    let lastPage = pg;
    $("a[href*='so.html'], .pagination a, .page-link").each((_, el) => {
        const href = $(el).attr('href') || "";
        const match = href.match(/[?&]page=(\d+)/);
        if (match) {
            const p = parseInt(match[1]);
            if (p > lastPage) lastPage = p;
        }
    });

    return JSON.stringify({
        page: parseInt(pg),
        pagecount: parseInt(lastPage),
        limit: 30,
        total: 99999,
        list: videos,
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
            wd: '国产',
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
        key: 'syjc',
        name: '🟢 深夜',
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