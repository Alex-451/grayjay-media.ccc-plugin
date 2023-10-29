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
		uploadDate: dateToUnixTime(e.release_date),
		duration: hhmmssToDuration(e.duration) ?? 0,
		viewCount: fromHumanNumber(e.view_count) ?? 0,
		url: e.url,
		isLive: false
	});
}

/**
 * Convert a Date to a unix time stamp
 * @param {String?} date Date to convert
 * @returns {number} Unix time stamp
 */
function dateToUnixTime(date) {
	if (!date) {
		return 0;
	}

	return Math.round(Date.parse(date) / 1000);
}

/**
 * Format a duration string to a duration in seconds
 * @param {String?} duration Duration string format (hh:mm:ss)
 * @returns {number} Duration in seconds
 */
function hhmmssToDuration(duration) {
	if (!duration) {
		return 0;
	}

	const parts = duration.split(':').map(Number);
	if (parts.length == 3) {
		return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
	} else if (parts.length == 2) {
		return (parts[0] * 60) + parts[1];
	} else if (parts.length == 1) {
		return parts[0];
	}

	return 0;
}

/**
 * Convert a human number i.e. "20.1K" to a machine number i.e. 20100
 * @param {String?} numStr Human number i.e. "20.1K"
 * @returns {number?} Machine number
 */
function fromHumanNumber(numStr) {
	if (!numStr) {
		return null;
	}

	const num = parseFloat(numStr.substring(0, numStr.length - 1));
	const lastChar = numStr.charAt(numStr.length - 1).toLowerCase();
	switch (lastChar) {
		case 'b':
			return Math.round(num * 1000000000);
		case 'm':
			return Math.round(num * 1000000);
		case 'k':
			return Math.round(num * 1000);
	}

	return Math.round(num);
}