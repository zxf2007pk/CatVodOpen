import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;

let SITE = 'https://ev5356.970xw.com';
let IMG_DOMAIN = '';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 9; V2196A Build/PQ3A.190705.08211809; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Mobile Safari/537.36;webank/h5face;webank/1.0;netType:NETWORK_WIFI;appVersion:416;packageName:com.jp3.xg3',
    'Referer': SITE,
};

async function request(url) {
    const res = await req(url, {
        method: 'get',
        headers: HEADERS,
    });
    let data = res.data;

    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.error('JSON Parse Error:', e);
        }
    }
    return data;
}

async function init(inReq, _outResp) {
    try {
        const res = await request(`${SITE}/api/appAuthConfig`);

        if (res && res.data && res.data.imgDomain) {
            let domain = res.data.imgDomain;
            IMG_DOMAIN = domain.startsWith('http') ? domain : 'https://' + domain;
        }
    } catch (e) {
        console.error('Init Error:', e);
    }
    return {};
}

async function home(inReq, _outResp) {
    const tabs = [
        { name: '电影', id: 1 },
        { name: '电视剧', id: 2 },
        { name: '动漫', id: 3 },
        { name: '综艺', id: 4 },
        { name: '纪录片', id: 50 },
        { name: 'Netflix', id: 99 },
    ];
    let classes = tabs.map(t => ({
        type_id: t.id,
        type_name: t.name
    }));
    return JSON.stringify({
        class: classes,
        filters: {}
    });
}

async function homeVod(inReq, _outResp) {
    if (!IMG_DOMAIN) await init();
    
    const url = `${SITE}/api/slide/list?pos_id=88`;
    const res = await request(url);
    let videos = [];
    
    const data = res.data || [];
    
    for (const e of data) {
        videos.push({
            vod_id: e.jump_id.toString(),
            vod_name: e.title,
            vod_pic: IMG_DOMAIN + e.thumbnail,
            vod_remarks: e.title 
        });
    }

    return JSON.stringify({
        list: videos
    });
}

async function category(inReq, _outResp) {
    const tid = parseInt(inReq.body.id);
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    
    if (!IMG_DOMAIN) await init();

    let videos = [];
    
    if (tid === 99 || tid === 50) {

        const url = `${SITE}/api/dyTag/list?category_id=${tid}&page=${pg}`;
        const res = await request(url);
        const data = res.data || [];

        for (const e of data) {

            if (e.dataList) {
                for (const item of e.dataList) {
                    videos.push({
                        vod_id: item.id.toString(),
                        vod_name: item.title,
                        vod_pic: IMG_DOMAIN + item.path,
                        vod_remarks: item.mask,
                    });
                }
            }
        }
    } else {

        const url = `${SITE}/api/crumb/list?fcate_pid=${tid}&area=0&year=0&type=0&sort=updata&page=${pg}&category_id=`;
        const res = await request(url);
        const data = res.data || [];

        for (const e of data) {
            videos.push({
                vod_id: e.id.toString(),
                vod_name: e.title,
                vod_pic: IMG_DOMAIN + e.path,
                vod_remarks: e.mask || '',
            });
        }
    }

    return JSON.stringify({
        page: parseInt(pg),
        pagecount: videos.length > 0 ? parseInt(pg) + 1 : parseInt(pg),
        limit: 20,
        total: 999,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const id = ids[0];
    
    if (!IMG_DOMAIN) await init();

    const url = `${SITE}/api/video/detailv2?id=${id}`;
    const res = await request(url);
    const data = res.data; 

    if (!data) return { list: [] };

    let vod = {
        vod_id: data.id ? data.id.toString() : id,
        vod_name: data.title || '',
        vod_pic: data.thumbnail ? (IMG_DOMAIN + data.thumbnail) : '',
        vod_remarks: data.mask || '',
        vod_content: data.intro || '',
        vod_year: data.year || '',
        vod_area: data.area || '',
        vod_director: data.director || '',
        vod_actor: data.actor || ''
    };

    let playFrom = [];
    let playUrls = [];

    if (data.source_list_source) {
        for (const e of data.source_list_source) {
            if (e.source_key === 'back_source_list_p2p') continue;
            
            let episodes = [];
            if (e.source_list) {
                for (const item of e.source_list) {

                    episodes.push(`${item.source_name}$${item.url}`);
                }
            }
            
            if (episodes.length > 0) {
                playFrom.push(e.name);
                playUrls.push(episodes.join('#'));
            }
        }
    }

    vod.vod_play_from = playFrom.join('$$$');
    vod.vod_play_url = playUrls.join('$$$');

    return {
        list: [vod],
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id; 
    return JSON.stringify({
        parse: 0,
        url: id,
        header: HEADERS
    });
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;

    if (!IMG_DOMAIN) await init();

    const url = `${SITE}/api/v2/search/videoV2?key=${encodeURIComponent(wd)}&category_id=88&page=${pg}&pageSize=20`;
    const res = await request(url);
    const data = res.data || [];
    
    let videos = [];
    for (const e of data) {
        videos.push({
            vod_id: e.id.toString(),
            vod_name: e.title,
            vod_pic: IMG_DOMAIN + e.thumbnail,
            vod_remarks: e.mask || ''
        });
    }

    return JSON.stringify({
        list: videos,
        page: parseInt(pg),
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
        printErr(resp.json());
        
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
                    const vod = dataResult.detail.list[0];
                    const flags = vod.vod_play_from.split('$$$');
                    const ids = vod.vod_play_url.split('$$$');
                    for (let j = 0; j < flags.length; j++) {
                        const flag = flags[j];
                        const urls = ids[j].split('#');
                        for (let i = 0; i < urls.length && i < 1; i++) {
                            resp = await inReq.server.inject().post(`${prefix}/play`).payload({
                                flag: flag,
                                id: urls[i].split('$')[1],
                            });
                            dataResult.play = resp.json();
                        }
                    }
                }
            }
        }
        
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '热门',
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
        key: 'jianpian',
        name: '🟢 荐片',
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