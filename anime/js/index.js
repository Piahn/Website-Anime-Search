// Import some utilities
import Utilities from "../../module/utilities.js";
const Utils = new Utilities();

// Import validate functions
import Validate from "../../module/validate.js";
const Valid = new Validate();

// Import error handling
import ErrorHandling from "../../module/errorHandling.js";
const Err = new ErrorHandling();

// Import graphql query
import { default as query } from "../../module/query.js";

// DOM elements
const searchBtn = document.getElementById("input-keyword");
const animeList = document.getElementById("anime-list");
const headerContent = document.querySelector("#header-content");
const paginationBtn = document.querySelector(".pagination");
const toastContent = document.getElementById("liveToast");
const toastBtn = document.getElementById("liveToastBtn");
const inputSearch = document.getElementById("input-keyword");

// When the search button got clicked
document.getElementById("search-button").addEventListener("click", async function () {
	getAndShowAnime(1, 6);
});

// When pagination got clicked (prev, numbers, next)
document.addEventListener("click", function (e) {
	paginationClick(e);
});

// When enter was clicked in search button
inputSearch.addEventListener("keyup", function (e) {
	if (e.key === "Enter") {
		getAndShowAnime(1, 6);
	}
});

/*
Cores function: get the anime's data and show it with pagination
*/
async function getAndShowAnime(currentPg = 1, perPage = 6) {
	try {
		// Empty the header content, anime list and pagination when the search button got clicked
		const keyword = Utils.inputKeyword(searchBtn.value, "anime", headerContent, animeList, paginationBtn);

		// Loading when retrieving data
		Utils.spinner(headerContent, animeList, paginationBtn);

		// Get the anime's data then validate it
		const data = Valid.anime(await getAnime(keyword, currentPg), headerContent, animeList);

		// Then show
		showAnime(data, currentPg, perPage);
	} catch (error) {
		// animeList.innerHTML = "";
		// paginationBtn.innerHTML = "";
		Utils.toastClick(toastContent, toastBtn, error);
	}
}

// Get the anime's data
async function getAnime(keyword) {
	// Define the config we'll need for our Api request
	return await fetch(`https://graphql.anilist.co`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query: query,
			variables: {
				search: keyword,
				// page: currentPage, // currentPage = 1
				// perPage: page, // page = 6
			},
		}),
	})
		// Make the HTTP Api request
		.then((response) => {
			return response.json();
		})
		.then((response) => {
			// If the response was contains errors
			if (response.errors) {
				Err.handling(headerContent, animeList, response.errors[0].message);
			}

			// If the response was success
			return response.data.Page;
		});
}

// Show anime and pagination
function showAnime(data, currentPage = 1, perPage = 6) {
	// Take the sum of anime data
	const sumData = data.media.length;

	// Take the page numbers for the pagination's number
	const pageNumbers = Math.floor(sumData / perPage);

	// Splice the anime's data based on perPage
	let animes = [];
	if (data.media.length >= perPage) {
		// If more than perPage
		for (let i = 0; i <= pageNumbers; i++) {
			animes.push(data.media.splice(i, perPage, data.media[perPage]));
		}
	} else {
		// If less than perPage (1 page)
		animes.push(data.media);
	}

	// Header content
	headerContent.innerHTML = `
		<h4 class="text-center">Search result of '${searchBtn.value}' :</h4>`;

	// Show anime's data
	let content = "";

	animes[currentPage - 1].forEach(
		({
			title,
			coverImage,
			startDate,
			id,
			studios: {
				nodes: [studio1],
			},
			duration,
			episodes,
			status,
			genres,
			synonyms,
			averageScore,
			tags,
			description,
			externalLinks,
			format,
			source,
		}) => {
			// Take the anime id
			const animeId = id;

			// Validate language title and set it to romaji if it's not available in english. If it's not available in romaji, set it to native.
			const [englishTitle, romajiTitle, nativeTitle] = Valid.titles(title);

			// Validate if the anime have no a cover image
			const cover = Valid.coverImages(coverImage);

			// Validate description if null/undefined and remove the source
			const desc = Valid.descriptions(description);

			// Validate released date if null/undefined
			const [day, month, year] = Valid.dateFormat(startDate);

			// Validate format if null/undefined
			const type = Valid.noUnderscore(format);

			// Validate genres if null/undefined
			const genre = Valid.genres(genres);

			// Validate studio if null/undefined
			const studioProducer = Valid.studioProducer(studio1);

			// Validate status if null/undefined and seperate it to 2 words (no underscore)
			const stat = Valid.noUnderscore(status);

			// Validate episodes if null/undefined
			const episode = Valid.validate(episodes);

			// Validate duration if null/undefined
			const time = Valid.validate(duration);

			// Validate the links that just Official Site, Youtube, Blibli, and Netflix
			const externalLink = Valid.siteLinks(externalLinks);

			// Validate synonyms if null/undefined
			const synonym = Valid.synonyms(synonyms);

			// Validate tags if null/undefined
			const tag = Valid.tags(tags);

			// Validate adaptation if null/undefined and seperate it to 2 words (no underscore)
			const adaptation = Valid.noUnderscore(source);

			// Validate score if null/undefined
			const average = Valid.validate(averageScore);

			// Add the anime's data to the content
			content += `
				<div class="col-12 col-lg-6 col-md-6 mb-5">
					<div class="card">
						<div class="card-body">
							<h4 class="card-title mb-4">${englishTitle !== "NO 'EN' TITLE" ? englishTitle : romajiTitle ? romajiTitle : nativeTitle}</h4>
							<hr>
							<img src="${cover}" alt="${englishTitle !== "NO 'EN' TITLE" ? englishTitle : romajiTitle ? romajiTitle : nativeTitle}" class="rounded img-fluid w-100">
							<h5 class="font-extrabold my-3">${year}</h5>
							
							<div class="modal-primary me-1 mb-1 d-inline-block">
								<!-- Button trigger for primary themes modal -->
								<button type="button" class="btn btn-primary" data-bs-toggle="modal"
									data-bs-target="#anime${animeId}">
									Detail
								</button>
								<!--primary theme Modal -->
								<div class="modal fade text-left" id="anime${animeId}" tabindex="-1" role="dialog"
									aria-labelledby="myModalLabel160" aria-hidden="true">
									<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl"
										role="document">
										<div class="modal-content">
											<div class="modal-header bg-primary">
												<div class="d-xl-flex justify-content-xl-around w-100 text-center fst-italic">
													<div>
														<h5 class="modal-title white" id="myModalLabel160">${englishTitle}</h5>
													</div>
													<div class="fw-italic">
														<h5 class="modal-title white">${romajiTitle}</h5>
													</div>
													<div>
														<h5 class="modal-title white">${nativeTitle}</h5>
													</div>
												</div>

												<!-- <button type="button" class="close" data-bs-dismiss="modal"
													aria-label="Close">
													<i data-feather="x"></i>
												</button> -->
											</div>
											<div class="modal-body">
												<div class="row">
													<div class="col-12 col-xl-5 mb-3">
														<img class="rounded img-fluid mx-auto d-block" src="${cover}" alt="${englishTitle}" />
													</div>
													<div class="col-12 col-xl-7">
														<ul class="list-group w-100">
															<li class="list-group-item"><span class="font-extrabold">Synonym: </span>${synonym}</li>
															<li class="list-group-item"><span class="font-extrabold">Description: </span>${desc}</li>
															<li class="list-group-item"><span class="font-extrabold">Released: </span>${day} ${month} ${year}</li>
															<li class="list-group-item"><span class="font-extrabold">Studio: </span>${studioProducer}</li>
															<li class="list-group-item"><span class="font-extrabold">Type: </span>${type}</li>
															<li class="list-group-item"><span class="font-extrabold">Adaptation: </span>${adaptation}</li>
															<li class="list-group-item"><span class="font-extrabold">Status: </span>${stat}</li>
															<li class="list-group-item"><span class="font-extrabold">Genre: </span>${genre}</li>
															<li class="list-group-item"><span class="font-extrabold">Episode: </span>${episode} episode(s)</li>
															<li class="list-group-item"><span class="font-extrabold">Duration: </span>${time} minute(s)</li>
															<li class="list-group-item"><span class="font-extrabold">Tag: </span>${tag}</li>
															<li class="list-group-item"><span class="font-extrabold">Average Score: </span>${average}</li>
															<li class="list-group-item"><span class="font-extrabold me-1">Site: </span>${externalLink}</li>
														</ul>
													</div>
												</div>
											</div>

											<div class="modal-footer">
												<button type="button" class="btn btn-outline-light"
													data-bs-dismiss="modal">
													<span class="d-sm-block">Close</span>
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>`;
		},
	);

	// Change the header content
	animeList.innerHTML = content;

	// Show pagination
	showPagination(sumData, perPage, currentPage);
}

function paginationClick(e) {
	if (e.target.classList.contains("page-link")) {
		const childrens = paginationBtn.children;
		let currentPage = e.target; // e.target.innerHTML
		const allBtn = document.querySelectorAll(".page-link");

		if (currentPage.textContent !== "Prev" && currentPage.textContent !== "Next") {
			// Remove active
			for (const child of childrens) {
				child.firstElementChild.classList.remove("active");
			}
			currentPage.classList.add("active");
			return getAndShowAnime(currentPage.innerHTML, 6);
		} else if (currentPage.textContent === "Next") {
			for (const btn of allBtn) {
				if (btn.classList.contains("active")) {
					let lastElement = btn.parentElement.parentElement.lastElementChild.previousElementSibling.firstChild.innerHTML;

					if (btn.innerHTML === lastElement) {
						return;
					}

					btn.classList.remove("active");
					btn.parentElement.nextElementSibling.firstElementChild.classList.add("active");
					currentPage = parseInt(btn.textContent) + 1;
					return getAndShowAnime(currentPage, 6);
				}
			}
		} else if (currentPage.textContent === "Prev") {
			for (const btn of allBtn) {
				if (btn.classList.contains("active")) {
					let firstElement = btn.parentElement.parentElement.firstElementChild.nextElementSibling.firstChild.innerHTML;

					if (btn.innerHTML === firstElement) {
						// btn.parentElement.previousElementSibling.firstElementChild.classList.add("disabled");
						return;
					}

					btn.classList.remove("active");
					btn.parentElement.previousElementSibling.firstElementChild.classList.add("active");
					currentPage = parseInt(btn.textContent) - 1;
					return getAndShowAnime(currentPage, 6);
				}
			}
		}
	}
}

function showPagination(totalData = 1, perPage, currentPage) {
	// Parse the current page to integer
	currentPage = parseInt(currentPage);

	// Empty the pagination
	paginationBtn.innerHTML = "";

	// If Math return 0, go return 1 instead nothing. If no, return the result
	let pagination = Math.ceil(totalData / perPage) === 0 ? 1 : Math.ceil(totalData / perPage);

	// Add child button (ex: 1, 2, 3)
	let paginationContent = "";
	for (let i = 1; i <= pagination; i++) {
		// Add Prev button
		if (i === 1) {
			// When near Prev, therefore disabled the Prev
			paginationContent = `
				<li class="page-item ${currentPage === i ? "disabled" : ""}">
					<a class="page-link" href="#" tabindex="-1" aria-disabled="true">Prev</a>
				</li>`;
		}

		paginationContent += `
			<li class="page-item ${currentPage === i ? "disabled" : ""}" ><a class="page-link ${currentPage === i ? "active" : ""}" href="#">${i}</a></li>
		`;

		// Add Next button
		if (i === pagination) {
			// When near Next, therefore disabled the Next
			paginationContent += `
				<li class="page-item ${currentPage === i ? "disabled" : ""}">
					<a class="page-link" href="#">Next</a>
				</li>
			`;
		}
	}

	// Show pagination
	paginationBtn.innerHTML = paginationContent;
}
