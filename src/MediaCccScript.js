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
	const initialResults = claimSearch(query);
	return new RecentPager(query, initialResults);
}

//Pagers
class RecentPager extends VideoPager {
	constructor(query, results) {
		super(results, results.length >= query.page_size, query);
	}
}

//Internal methods
function claimSearch(query) {
	const body = JSON.stringify({
		method: "claim_search",
		params: query
	});
	const resp = http.POST(URL_CLAIM_SEARCH, body, {
		"Content-Type": "application/json" 
	});
	if(resp.code >= 300)
		throw "Failed to search claims\n" + resp.body;
	const result = JSON.parse(resp.body);
	return result.result.items.map((x)=> lbryVideoToPlatformVideo(x));
}