const URL_CONTENT = "https://api.media.ccc.de/public/"

const PLATFORM = "media.ccc.de";


var config = {};

//Source Methods
source.enable = function (conf) {
	config = conf ?? {};
	log(config);
}

source.getHome = function(continuationToken) {
    const videos = getCccContentData(); // The results (PlatformVideo)
    return new getRecentPager(videos);
}

//Internals
function getCccContentData() {
	const resp = http.GET(URL_CONTENT+"events/recent/", {});
	const contentResp = JSON.parse(resp.body);
	
	return contentResp.events;
}
function getRecentPager(query) {
	return new RecentPager(query);
}

//Pagers
class RecentPager extends VideoPager {
	constructor(results) {
		super(results);
	}
}