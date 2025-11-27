import req from '../../util/req.js';
import { formatPlayUrl } from '../../util/misc.js';

let url = 'http://api.hclyz.com:81';

const channels = [
    { name: "咪狐", id: "jsonmihu" },
    { name: "卡哇伊", id: "jsonkawayi" },
    { name: "花蝴蝶", id: "jsonhuahudie" },
    { name: "蜜桃", id: "jsonmitao" },
    { name: "番茄社区", id: "jsonfanjiashequ" },
    { name: "LOVE", id: "jsonLOVE" },
    { name: "小妲己", id: "jsonxiaodaji" },
    { name: "77直播", id: "json77zhibo" },
    { name: "依依", id: "jsonyiyi" },
    { name: "日出", id: "jsonrichu" },
    { name: "彩虹", id: "jsoncaihong" },
    { name: "久久", id: "jsonjiujiu" },
    { name: "亚米", id: "jsonyami" },
    { name: "蝶恋", id: "jsondielian" },
    { name: "夜妖姬", id: "jsonyeyaoji" },
    { name: "套路", id: "jsontaolu" },
    { name: "樱花", id: "jsonyinghua" },
    { name: "享色", id: "jsonxiangse" },
    { name: "红浪漫", id: "jsonhonglangman" },
    { name: "金鱼", id: "jsonjinyu" },
    { name: "桃花", id: "jsontaohua" },
    { name: "花房", id: "jsonhuafang" },
    { name: "小仙女", id: "jsonxiaoxiannu" },
    { name: "视觉秀", id: "jsonshijuexiu" },
    { name: "小天使", id: "jsonxiaotianshi" },
    { name: "一直播", id: "jsonyizhibo" },
    { name: "彩云", id: "jsoncaiyun" },
    { name: "暗语", id: "jsonanyu" },
    { name: "咪咪", id: "jsonmimi" },
    { name: "娇媚", id: "jsonjiaomei" },
    { name: "黄瓜", id: "jsonhuanggua" },
    { name: "色趣", id: "jsonsequ" },
    { name: "糯米", id: "jsonnuomi" },
    { name: "小蜜蜂", id: "jsonxiaomifeng" },
    { name: "小红帽", id: "jsonxiaohongmao" },
    { name: "桃花运", id: "jsontaohuayun" },
    { name: "苦瓜", id: "jsonkugua" },
    { name: "爱爱你", id: "jsonaiaini" },
    { name: "樱花雨i", id: "jsonyinghuayui" },
    { name: "盘他", id: "jsonpanta" },
    { name: "夜色", id: "jsonyese" },
    { name: "蝴蝶", id: "jsonhudie" },
    { name: "小天仙", id: "jsonxiaotianxian" },
    { name: "杏趣", id: "jsonxingqu" },
    { name: "小坏蛋", id: "jsonxiaohuaidan" },
    { name: "飘雪", id: "jsonpiaoxue" },
    { name: "樱桃", id: "jsonyingtao" },
    { name: "奥斯卡", id: "jsonaosika" },
    { name: "卡路里", id: "jsonkaluli" },
    { name: "红高粱", id: "jsonhonggaoliang" },
    { name: "付宝", id: "jsonfubao" },
    { name: "小黄书", id: "jsonxiaohuangshu" },
    { name: "二嫂", id: "jsonersao" },
    { name: "花果山", id: "jsonhuaguoshan" },
    { name: "云鹿", id: "jsonyunlu" },
    { name: "菠萝", id: "jsonboluo" },
    { name: "星宝贝", id: "jsonxingbaobei" },
    { name: "夜艳", id: "jsonyeyan" },
    { name: "七仙女s", id: "jsonqixiannus" },
    { name: "夜来香", id: "jsonyelaixiang" },
    { name: "爱零", id: "jsonailing" },
    { name: "十八禁", id: "jsonshibajin" },
    { name: "兰桂坊", id: "jsonlanguifang" },
    { name: "Dancelife", id: "jsonDancelife" },
    { name: "小萌猪", id: "jsonxiaomengzhu" },
    { name: "蝴蝶飞", id: "jsonhudiefei" },
    { name: "幽梦", id: "jsonyoumeng" },
    { name: "丽柜厅", id: "jsonliguiting" },
    { name: "蛟龙", id: "jsonjiaolong" },
    { name: "颜如玉", id: "jsonyanruyu" },
    { name: "橙秀", id: "jsonchengxiu" },
    { name: "豹娱l", id: "jsonbaoyul" },
    { name: "小花螺", id: "jsonxiaohualuo" },
    { name: "皇后", id: "jsonhuanghou" },
    { name: "心之恋", id: "jsonxinzhilian" },
    { name: "欧美FEATURED", id: "jsonoumeiFEATURED" },
    { name: "欧美FEMALE", id: "jsonoumeiFEMALE" },
    { name: "欧美MALE", id: "jsonoumeiMALE" },
    { name: "欧美COUPLE", id: "jsonoumeiCOUPLE" },
    { name: "欧美TRANS", id: "jsonoumeiTRANS" },
    { name: "台妹l", id: "jsontaimeil" },
    { name: "爱恋", id: "jsonailian" },
    { name: "903娱乐", id: "json903yule" },
    { name: "尤物岛", id: "jsonyouwudao" },
    { name: "坦克", id: "jsontanke" },
    { name: "好基友", id: "jsonhaojiyou" },
    { name: "夜女郎", id: "jsonyenulang" },
    { name: "娇喘", id: "jsonjiaochuan" },
    { name: "芒果派", id: "jsonmangguopai" },
    { name: "媚颜", id: "jsonmeiyan" },
    { name: "风流", id: "jsonfengliu" },
    { name: "夜律", id: "jsonyelu" },
    { name: "玲珑", id: "jsonlinglong" },
    { name: "浴火", id: "jsonyuhuo" },
    { name: "翠鸟", id: "jsoncuiniao" },
    { name: "幸运星", id: "jsonxingyunxing" },
    { name: "她秀", id: "jsontaxiu" },
    { name: "招财猫", id: "jsonzhaocaimao" },
    { name: "双碟", id: "jsonshuangdie" },
    { name: "糖果", id: "jsontangguo" },
    { name: "么么哒", id: "jsonmemeda" },
    { name: "小性感", id: "jsonxiaoxinggan" },
    { name: "小喵宠", id: "jsonxiaomiaochong" },
    { name: "兔女郎", id: "jsontunulang" },
    { name: "睡美人", id: "jsonshuimeiren" },
    { name: "金呗", id: "jsonjinbei" },
    { name: "美夕", id: "jsonmeixi" },
    { name: "小妖", id: "jsonxiaoyao" },
    { name: "约直播", id: "jsonyuezhibo" },
    { name: "花仙子", id: "jsonhuaxianzi" },
    { name: "土豪", id: "jsontuhao" },
    { name: "红妆", id: "jsonhongzhuang" },
    { name: "妞妞", id: "jsonniuniu" },
    { name: "艳后", id: "jsonyanhou" },
    { name: "moon", id: "jsonmoon" },
    { name: "蓝猫", id: "jsonlanmao" },
    { name: "美人妆", id: "jsonmeirenzhuang" },
    { name: "入巷", id: "jsonruxiang" },
    { name: "持久男", id: "jsonchijiunan" },
    { name: "倾心", id: "jsonqingxin" },
    { name: "小精灵", id: "jsonxiaojingling" },
    { name: "偶遇", id: "jsonouyu" },
    { name: "灰灰", id: "jsonhuihui" },
    { name: "猫头鹰", id: "jsonmaotouying" },
    { name: "喜欢你", id: "jsonxihuanni" },
    { name: "夜纯", id: "jsonyechun" },
    { name: "杏播", id: "jsonxingbo" },
    { name: "名流", id: "jsonmingliu" },
    { name: "小辣椒", id: "jsonxiaolajiao" },
    { name: "蚊香社", id: "jsonwenxiangshe" },
    { name: "牵手", id: "jsonqianshou" },
    { name: "情趣", id: "jsonqingqu" }
];

async function request(reqUrl, ua) {
    return await req.get(reqUrl, {
        headers: {
            'User-Agent': ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
    });
}

async function init(inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    let classes = [];
    for (const channel of channels) {
        classes.push({
            type_id: channel.id,
            type_name: channel.name,
        });
    }
    return {
        class: classes,
        filters: {},
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page || 1;
    if (pg > 1) {
        return {
            page: pg,
            pagecount: 1,
            limit: 999,
            total: 0,
            list: [],
        };
    }

    let reqUrl = `${url}/mf/${tid}.txt`;
    let resp = await request(reqUrl);
    let data = resp.data;

    let videos = [];
    if (data && data.zhubo && Array.isArray(data.zhubo)) {
        for (const zhubo of data.zhubo) {
            let title = zhubo.title || '未知标题';
            let address = zhubo.address;
            let img = zhubo.img || '';

            if (address) {
                videos.push({
                    vod_id: address + '@@@' + title + '@@@' + img,
                    vod_name: title,
                    vod_pic: img,
                    vod_remarks: 'Live',
                });
            }
        }
    }

    return {
        page: 1,
        pagecount: 1,
        limit: videos.length,
        total: videos.length,
        list: videos,
    };
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const idStr of ids) {
        let parts = idStr.split('@@@');
        let playUrl = parts[0];
        let title = parts.length > 1 ? parts[1] : '直播频道';
        let pic = parts.length > 2 ? parts[2] : '';

        let vod = {
            vod_id: idStr,
            vod_name: title,
            vod_pic: pic,
            type_name: '直播',
            vod_year: '',
            vod_area: '',
            vod_remarks: '',
            vod_actor: '',
            vod_director: '',
            vod_content: title,
        };

        let t = formatPlayUrl(vod.vod_name, '直播');
        if (t.length == 0) t = '直播';
        
        let playFrom = '默认';
        let playUrlStr = t + '$' + playUrl;

        vod.vod_play_from = playFrom;
        vod.vod_play_url = playUrlStr;
        
        videos.push(vod);
    }

    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return {
        parse: 0,
        url: id,
        header: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
    };
}

async function search(inReq, _outResp) {
    return {
        page: 1,
        pagecount: 1,
        list: [],
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
            const firstCategory = dataResult.home.class[0];
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: firstCategory.type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            
            if (dataResult.category.list.length > 0) {
                const firstVideo = dataResult.category.list[0];
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: firstVideo.vod_id,
                });
                dataResult.detail = resp.json();
                
                if (dataResult.detail.list.length > 0) {
                    dataResult.play = [];
                    const vod = dataResult.detail.list[0];
                    const flags = vod.vod_play_from.split('$$$');
                    const ids = vod.vod_play_url.split('$$$');
                    
                    for (let j = 0; j < flags.length; j++) {
                        const flag = flags[j];
                        const urls = ids[j].split('#');
                        for (let i = 0; i < urls.length && i < 1; i++) {
                            const urlId = urls[i].split('$')[1];
                            resp = await inReq.server
                                .inject()
                                .post(`${prefix}/play`)
                                .payload({
                                    flag: flag,
                                    id: urlId,
                                });
                            dataResult.play.push(resp.json());
                        }
                    }
                }
            }
        }
        
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'fenmei_live',
        name: '🟢 粉妹',
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