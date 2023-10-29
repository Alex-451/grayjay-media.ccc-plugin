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
	return getRecentPager(URL_RECENT, {});
}

//Internals
function getRecentPager(url, params) {
	const resp = http.GET(`${url}${buildQuery(params)}`, {});

	if (resp.code == 200) {
		const contentResp = JSON.parse(resp.body);
		const results = parseVideoListingEntries(contentResp.events);
		let hasMore = false;
		return new RecentPager(results, hasMore, url, params);
	}

	return new VideoPager([]);
}

//Pagers
class RecentPager extends VideoPager {
	constructor(results, hasMore, url, params) {
		super(results, hasMore, { url, params });
	}
}

//Internal methods
function buildQuery(params) {
	let query = "";
	let first = true;
	for (const [key, value] of Object.entries(params)) {
		if (value) {
			if (first) {
				first = false;
			} else {
				query += "&";
			}

			query += `${key}=${value}`;
		}
	}

	return (query && query.length > 0) ? `?${query}` : ""; 
}

function parseVideoListingEntries(elements) {
	const res = [];
	for (let i = 0; i < elements.length; i++) {
		const e = elements[i];
		res.push(parseVideoListingEntry(e));
	}

	return res;
}


/**
 * Parse a HTML video-listing-entry element to a JSON element
 * @returns {PlatformVideo} Platform video
 */
function parseVideoListingEntry(e) {
	return new PlatformVideo({
		id: new PlatformID(PLATFORM, e.guid, config.id),
		name: e.title?.textContent ?? "",
		thumbnails: new Thumbnails([
			new Thumbnail(e.poster_url, 1080)
		]),
		author: new PlatformAuthorLink("Id",
			"name", 
			"link to author profile",
			"link to author avatar"),
		uploadDate: e.release_date,
		duration: e.duration ?? 0,
		viewCount: e.view_count ?? 0,
		url: e.url,
		isLive: false
	});
}
