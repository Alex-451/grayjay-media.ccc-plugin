const URL_BASE = "https://api.media.ccc.de/public"
const URL_RECENT = `${URL_BASE}/events/recent`

const PLATFORM = "media.ccc.de";

var config = {};

//#region Source Methods
source.enable = function (conf) {
	config = conf ?? {};
	log(config);
}

source.getHome = function() {
	return getRecentVideosPager(URL_RECENT, {});
}

//#endregion

//#region Pagers

/**
 * Retrieves the recent videos pager
 * @param {String} url The base URL
 * @param {{[key: string]: any}} params Query parameters
 * @returns {RecentVideoPager?} Videos pager
 */
function getRecentVideosPager(url, params) {
	const resp = http.GET(`${url}${buildQuery(params)}`, {});

	if (resp.code == 200) {
		const contentResp = JSON.parse(resp.body);
		const results = parseVideoListingEntries(contentResp.events);
		let hasMore = false;
		return new RecentVideoPager(results, hasMore, url, params);
	}

	return new VideoPager([], false);
}

class RecentVideoPager extends VideoPager {
	constructor(results, hasMore, url, params) {
		super(results, hasMore, { url, params });
	}
}

//#endregion

//#region Internal methods

/**
 * Build a query
 * @param {{[key: string]: any}} params Query params
 * @returns {String} Query string
 */
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

/**
 * Parse a HTML collection video-listing-entry element to a PlatformVideo element
 * @returns {PlatformVideo[]} Platform videos
 */
function parseVideoListingEntries(elements) {
	const res = [];
	for (let i = 0; i < elements.length; i++) {
		const e = elements[i];
		const conferenceInfo = getConferenceInfo(contentResp.conference_url);
		res.push(parseVideoListingEntry(e, conferenceInfo));
	}

	return res;
}

/**
 * Parse a HTML video-listing-entry element to a PlatformVideo element
 * @returns {PlatformVideo} Platform video
 */
function parseVideoListingEntry(e, conferenceInfo) {
	return new PlatformVideo({
		id: new PlatformID(PLATFORM, e.guid, config.id),
		name: e.title?.textContent ?? "",
		thumbnails: new Thumbnails([
			new Thumbnail(e.poster_url, 1080)
		]),
		author: new PlatformAuthorLink(
			new PlatformID(PLATFORM, conferenceInfo.acronym, config.id), 
			e.conference_title, 
			`https://media.ccc.de/c/${conferenceInfo.acronym}`, 
			conferenceInfo.logo_url),
		uploadDate: Number(e.release_date),
		duration: Number(e.duration) ?? 0,
		viewCount: e.view_count ?? 0,
		url: e.url,
		isLive: false
	});
}

function getConferenceInfo(conferenceUrl) {
	const resp = http.GET(conferenceUrl, {});

	if (resp.code == 200) {
		const contentResp = JSON.parse(resp.body);
		return contentResp;
	}
}


//#endregion
