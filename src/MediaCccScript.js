const URL_BASE = "https://api.media.ccc.de/public"
const URL_RECENT = `${URL_BASE}/events/recent`

const PLATFORM = "media.ccc.de";


var config = {};

//Source Methods
source.enable = function (conf) {
	config = conf ?? {};
	log(config);
}

source.getHome = function() {
	return getRecentPager(URL_RECENT);
}

//Internals
function getCccContentData() {
	const resp = http.GET(URL_CONTENT+"events/recent/", {});
	const contentResp = JSON.parse(resp.body);
	
	return contentResp.events;
}
function getRecentPager(url) {
	const res = http.GET(`${url}${buildQuery(params)}`, {});
	const contentResp = JSON.parse(resp.body);

	if (res.code == 200) {
		return new RecentPager(contentResp.events);
	}

	return new RecentPager([]);
}

//Pagers
class RecentPager extends VideoPager {
	constructor(results) {
		super(results);
	}
}