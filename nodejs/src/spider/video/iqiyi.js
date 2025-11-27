import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;

let HOST = 'https://www.iqiyi.com';
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': UA,
            'Referer': HOST,
        },
    });
    return res.data;
}

async function init(inReq, outResp) {
    return {};
}

async function home(inReq, outResp) {
    let classes = [
        { type_id: "1", type_name: "电影" },
        { type_id: "2", type_name: "电视剧" },
        { type_id: "3", type_name: "纪录片" },
        { type_id: "4", type_name: "动漫" },
        { type_id: "6", type_name: "综艺" },
        { type_id: "5", type_name: "音乐" },
        { type_id: "16", type_name: "网络电影" }
    ];
    let filterObj = {};
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function homeVod(inReq, outResp) {
    try {
        const body = { id: "2", page: 1 };
        const mockReq = { body: body };
        const res = await category(mockReq, null);
        return res;
    } catch (e) {
        return JSON.stringify({ list: [] });
    }
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;

    let channelId = tid;
    let threeCategoryId = '';
    let dataType = '1';

    if (tid === "16") {
        channelId = "1";
        threeCategoryId = "27401";
    } else if (tid === "5") {
        dataType = "2";
    }

    let link = `https://pcw-api.iqiyi.com/search/recommend/list?channel_id=${channelId}&data_type=${dataType}&page_id=${pg}&ret_num=24`;
    if (threeCategoryId) {
        link += `&three_category_id=${threeCategoryId}`;
    }

    let videos = [];
    try {
        const json = await request(link);
        
        if (json.data && json.data.list) {
            json.data.list.forEach(data => {
                let remarks = '';
                if (data.channelId === 1) {
                    remarks = data.score ? data.score + "分" : "";
                } else if (data.channelId === 2 || data.channelId === 4) {
                    if (data.latestOrder === data.videoCount) {
                        remarks = (data.score ? data.score + "分 " : "") + data.latestOrder + "集全";
                    } else {
                        remarks = "更新至" + data.latestOrder + "集";
                    }
                } else if (data.channelId === 6) {
                    remarks = data.period + "期";
                } else {
                    remarks = data.latestOrder ? "更新至" + data.latestOrder + "期" : (data.period || data.focus);
                }

                let pic = data.imageUrl || "";
                if (pic.includes(".jpg")) {
                    pic = pic.replace(".jpg", "_390_520.jpg");
                }

                videos.push({
                    vod_id: data.albumId.toString(),
                    vod_name: data.name,
                    vod_pic: pic,
                    vod_remarks: remarks,
                });
            });
        }
    } catch (e) {
        console.error("Category error:", e);
    }

    return JSON.stringify({
        page: parseInt(pg),
        pagecount: videos.length === 24 ? parseInt(pg) + 1 : parseInt(pg),
        limit: 24,
        total: 999,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const url = `https://pcw-api.iqiyi.com/video/video/videoinfowithuser/${id}?agent_type=1&authcookie=&subkey=${id}&subscribe=1`;
        try {
            const jsonRes = await request(url);
            if (!jsonRes || !jsonRes.data) continue;
            const json = jsonRes.data;

            let pic = json.imageUrl || "";
            if (pic.includes(".jpg")) {
                pic = pic.replace(".jpg", "_579_772.jpg");
            }

            let vod = {
                vod_id: id,
                vod_name: json.name,
                vod_pic: pic,
                vod_type: (json.categories || []).map(it => it.name).join(","),
                vod_area: json.areas || "",
                vod_content: json.description,
                vod_actor: json.people && json.people.main_charactor ? json.people.main_charactor.map(it => it.name).join(",") : "",
                vod_director: json.people && json.people.director ? json.people.director.map(it => it.name).join(",") : "",
            };

            if (json.latestOrder) {
                vod.vod_remarks = "更新至" + json.latestOrder + (json.videoCount ? "/共" + json.videoCount : "");
            } else {
                vod.vod_remarks = json.period || json.subtitle || "";
            }

            let epList = [];
            
            if (json.channelId === 1 || json.channelId === 5) {
                epList.push({
                    title: json.shortTitle || json.name,
                    url: json.playUrl
                });
            } else if (json.channelId === 6) {
                let qs = json.period ? json.period.split("-")[0] : "";
                if (qs) {
                    let listUrl = `https://pcw-api.iqiyi.com/album/source/svlistinfo?cid=6&sourceid=${json.albumId}&timelist=${qs}`;
                    let listRes = await request(listUrl);
                    if (listRes && listRes.data && listRes.data[qs]) {
                        listRes.data[qs].forEach(it => {
                            epList.push({
                                title: it.shortTitle || it.period || it.focus,
                                url: it.playUrl
                            });
                        });
                    }
                }
            } else {
                let listUrl = `https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=${json.albumId}&size=200&page=1`;
                let listRes = await request(listUrl);
                if (listRes && listRes.data) {
                    const total = listRes.data.total;
                    epList = epList.concat(listRes.data.epsodelist || []);
                    if (total > 200) {
                        const maxPage = Math.min(Math.ceil(total / 200), 3);
                        for (let i = 2; i <= maxPage; i++) {
                            let nextUrl = `https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid=${json.albumId}&size=200&page=${i}`;
                            let nextRes = await request(nextUrl);
                            if (nextRes.data && nextRes.data.epsodelist) {
                                epList = epList.concat(nextRes.data.epsodelist);
                            }
                        }
                    }
                }
            }

            let playUrlStr = epList.map(it => {
                let t = it.order ? `第${it.order}集` : (it.shortTitle || it.period || it.title || "正片");
                if (!t.trim()) t = "正片";
                return `${t}$${it.playUrl}`;
            }).join("#");

            vod.vod_play_from = "爱奇艺";
            vod.vod_play_url = playUrlStr;

            videos.push(vod);
        } catch (e) {
            console.error("Detail error:", e);
        }
    }

    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id; 

	const parseApi = "http://jx.dedyn.io/?url=";
    const targetUrl = parseApi + encodeURIComponent(id);

    try {

        const res = await request(targetUrl);
        

        let json = res;
        if (typeof res === 'string') {
            try {
                json = JSON.parse(res);
            } catch (e) {
                console.error("JSON Parse Error:", e);
            }
        }

        if (json && json.url) {
            return JSON.stringify({
                parse: 0, 
                url: json.url,
                header: {
                    'User-Agent': UA
                }
            });
        }
    } catch (e) {
        console.error("Parse Error:", e);
    }

    return JSON.stringify({
        parse: 1,
        url: id,
        header: {
            'User-Agent': UA
        }
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;

    if (pg > 1) return JSON.stringify({ list: [] });

    const link = `https://search.video.iqiyi.com/o?if=html5&key=${encodeURIComponent(wd)}&pageNum=1&pos=1&pageSize=24&site=iqiyi`;
    
    let videos = [];
    try {
        const json = await request(link);
        if (json && json.data && json.data.docinfos) {
            json.data.docinfos.forEach(it => {
                if (it.albumDocInfo) {
                    let info = it.albumDocInfo;
                    let pic = info.albumVImage || "";
                    if (pic.includes(".jpg")) {
                        pic = pic.replace(".jpg", "_390_520.jpg");
                    }

                    videos.push({
                        vod_id: info.albumId.toString(),
                        vod_name: info.albumTitle,
                        vod_pic: pic,
                        vod_remarks: info.channel,
                        vod_content: info.tvFocus
                    });
                }
            });
        }
    } catch (e) {
        console.error("Search error:", e);
    }

    return JSON.stringify({
        list: videos
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
                id: "2",
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
                    const vod = dataResult.detail.list[0];
                    const flags = vod.vod_play_from.split('$$$');
                    const ids = vod.vod_play_url.split('$$$');
                    
                    for (let j = 0; j < flags.length; j++) {
                        const flag = flags[j];
                        const urls = ids[j].split('#');
                        for (let i = 0; i < urls.length && i < 1; i++) {
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
        
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '狂飙',
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
        key: 'iqiyi',
        name: '🟢 奇艺',
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
