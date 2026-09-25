const root = document.documentElement;
const body = document.body;
const themeToggle = document.querySelector('[data-theme-toggle]');
const lightbox = document.querySelector('[data-lightbox-dialog]');
const lightboxImage = document.querySelector('[data-lightbox-image]');
const lightboxTitle = document.querySelector('[data-lightbox-title]');
const closeButtons = document.querySelectorAll('[data-lightbox-close]');
const photoTriggers = document.querySelectorAll('[data-lightbox="true"]');
const gallerySections = document.querySelectorAll('.gallery-section');
const sectionTabs = document.querySelectorAll('[data-section-tab]');
const studyDesk = document.querySelector('.study-desk');
const deskPhotos = studyDesk ? studyDesk.querySelectorAll('.photo-card') : [];
const savedTheme = localStorage.getItem('portfolio-theme');

const setTheme = (theme) => {
	const isDark = theme === 'dark';
	body.classList.toggle('dark-theme', isDark);
	root.dataset.theme = isDark ? 'dark' : 'light';
	themeToggle.setAttribute('aria-pressed', String(isDark));
	themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
	themeToggle.querySelector('.theme-toggle__label').textContent = isDark ? 'Dark mode' : 'Light mode';
	localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
};

setTheme(savedTheme === 'dark' ? 'dark' : 'light');

themeToggle.addEventListener('click', () => {
	setTheme(body.classList.contains('dark-theme') ? 'light' : 'dark');
});

const activateSectionTab = (sectionId, shouldFocus = false) => {
	sectionTabs.forEach((tab) => {
		const isActive = tab.dataset.sectionTab === sectionId;
		tab.setAttribute('aria-selected', String(isActive));
		tab.tabIndex = isActive ? 0 : -1;
		if (isActive && shouldFocus) tab.focus();
	});

	gallerySections.forEach((section) => {
		section.hidden = section.id !== sectionId;
		section.classList.toggle('is-active', section.id === sectionId);
	});
};

activateSectionTab('section-focus');

sectionTabs.forEach((tab, index) => {
	tab.addEventListener('click', () => {
		activateSectionTab(tab.dataset.sectionTab);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});

	tab.addEventListener('keydown', (event) => {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		let nextIndex = index;
		if (event.key === 'ArrowLeft') nextIndex = (index - 1 + sectionTabs.length) % sectionTabs.length;
		if (event.key === 'ArrowRight') nextIndex = (index + 1) % sectionTabs.length;
		if (event.key === 'Home') nextIndex = 0;
		if (event.key === 'End') nextIndex = sectionTabs.length - 1;
		const nextTab = sectionTabs[nextIndex];
		activateSectionTab(nextTab.dataset.sectionTab, true);
	});
});

const closeLightbox = () => {
	lightbox.hidden = true;
	document.body.style.overflow = '';
	lightboxImage.removeAttribute('src');
};

photoTriggers.forEach((trigger) => {
	trigger.addEventListener('click', () => {
		const image = trigger.querySelector('img');
		lightboxImage.src = image.src;
		lightboxImage.alt = image.alt;
		lightboxTitle.textContent = trigger.dataset.title;
		lightbox.hidden = false;
		document.body.style.overflow = 'hidden';
		lightbox.querySelector('.lightbox__close').focus();
	});
});

closeButtons.forEach((button) => button.addEventListener('click', closeLightbox));

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
});

body.classList.add('reveal-ready');

if ('IntersectionObserver' in window) {
	const revealObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			entry.target.classList.add('is-visible');
			observer.unobserve(entry.target);
		});
	}, { threshold: 0.16 });

	gallerySections.forEach((section) => revealObserver.observe(section));
} else {
	gallerySections.forEach((section) => section.classList.add('is-visible'));
}

if (studyDesk && deskPhotos.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
	let framePending = false;
	let interactionResetTimer;
	let pointerX = 0;
	let pointerY = 0;
	const depth = [0.55, 0.65, 0.8, 1, 0.35];

	const setMakeRoom = (activePhoto) => {
		window.clearTimeout(interactionResetTimer);
		studyDesk.classList.add('is-interacting');
		const activeBounds = activePhoto.getBoundingClientRect();
		const activeCenter = {
			x: activeBounds.left + activeBounds.width / 2,
			y: activeBounds.top + activeBounds.height / 2
		};

		deskPhotos.forEach((photo) => {
			photo.classList.toggle('is-hovered', photo === activePhoto);
			photo.style.zIndex = photo === activePhoto ? '50' : '';

			if (photo === activePhoto) {
				photo.style.setProperty('--make-room-x', '0px');
				photo.style.setProperty('--make-room-y', '0px');
				return;
			}

			const bounds = photo.getBoundingClientRect();
			const deltaX = bounds.left + bounds.width / 2 - activeCenter.x;
			const deltaY = bounds.top + bounds.height / 2 - activeCenter.y;
			const distance = Math.hypot(deltaX, deltaY) || 1;
			const amount = Math.max(25, Math.min(60, 66 - distance / 12));

			photo.style.setProperty('--make-room-x', `${(deltaX / distance) * amount}px`);
			photo.style.setProperty('--make-room-y', `${(deltaY / distance) * amount}px`);
		});
	};

	const resetMakeRoom = () => {
		window.clearTimeout(interactionResetTimer);
		studyDesk.classList.add('is-interacting');
		deskPhotos.forEach((photo) => {
			photo.classList.remove('is-hovered');
			photo.style.zIndex = '';
			photo.style.setProperty('--make-room-x', '0px');
			photo.style.setProperty('--make-room-y', '0px');
		});
		interactionResetTimer = window.setTimeout(() => {
			studyDesk.classList.remove('is-interacting');
		}, 100);
	};

	deskPhotos.forEach((photo) => {
		photo.addEventListener('pointerenter', () => setMakeRoom(photo));
		photo.addEventListener('focusin', () => setMakeRoom(photo));
	});

	studyDesk.addEventListener('pointerleave', resetMakeRoom);
	studyDesk.addEventListener('focusout', (event) => {
		if (!studyDesk.contains(event.relatedTarget)) resetMakeRoom();
	});

	const updateParallax = () => {
		framePending = false;
		deskPhotos.forEach((photo, index) => {
			photo.style.setProperty('--parallax-x', `${pointerX * depth[index]}px`);
			photo.style.setProperty('--parallax-y', `${pointerY * depth[index]}px`);
		});
	};

	studyDesk.addEventListener('pointermove', (event) => {
		const bounds = studyDesk.getBoundingClientRect();
		pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 14;
		pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
		if (!framePending) {
			framePending = true;
			requestAnimationFrame(updateParallax);
		}
	});

	studyDesk.addEventListener('pointerleave', () => {
		pointerX = 0;
		pointerY = 0;
		if (!framePending) {
			framePending = true;
			requestAnimationFrame(updateParallax);
		}
	});
}

const noticeBoard = document.querySelector('[data-notice-board]');
const noticeItems = noticeBoard ? noticeBoard.querySelectorAll('.notice-item') : [];
const noticeShuffle = document.querySelector('[data-notice-shuffle]');
let currentBoardLayout = 0;
let noticeAutoTimer = null;
let noticeBoardVisible = false;
let noticeBoardInteracting = false;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const boardLayouts = [
	[
		{ left: '5%', top: '7%', width: '40%', rotation: '-5deg', z: 3 },
		{ left: '55%', top: '8%', width: '40%', rotation: '4deg', z: 4 },
		{ left: '5%', top: '55%', width: '40%', rotation: '-3deg', z: 5 },
		{ left: '55%', top: '55%', width: '40%', rotation: '6deg', z: 6 }
	],
	[
		{ left: '55%', top: '55%', width: '40%', rotation: '6deg', z: 6 },
		{ left: '5%', top: '55%', width: '40%', rotation: '-4deg', z: 4 },
		{ left: '5%', top: '7%', width: '40%', rotation: '3deg', z: 5 },
		{ left: '55%', top: '8%', width: '40%', rotation: '-6deg', z: 3 }
	],
	[
		{ left: '5%', top: '55%', width: '40%', rotation: '-7deg', z: 5 },
		{ left: '5%', top: '7%', width: '40%', rotation: '5deg', z: 6 },
		{ left: '55%', top: '55%', width: '40%', rotation: '-3deg', z: 3 },
		{ left: '55%', top: '8%', width: '40%', rotation: '4deg', z: 4 }
	]
];

const applyBoardLayout = (layout) => {
	noticeItems.forEach((item, index) => {
		const position = layout[index];
		item.style.setProperty('--board-left', position.left);
		item.style.setProperty('--board-top', position.top);
		item.style.setProperty('--board-width', position.width);
		item.style.setProperty('--board-rotation', position.rotation);
		item.style.setProperty('--board-z', position.z);
	});
};

const stopNoticeAutoShuffle = () => {
	if (noticeAutoTimer) {
		clearTimeout(noticeAutoTimer);
		noticeAutoTimer = null;
	}
};

const scheduleNoticeAutoShuffle = () => {
	stopNoticeAutoShuffle();
	if (!noticeBoardVisible || noticeBoardInteracting || reducedMotion) return;
	noticeAutoTimer = setTimeout(shuffleBoard, 6000);
};

const shuffleBoard = () => {
	currentBoardLayout = (currentBoardLayout + 1) % boardLayouts.length;
	applyBoardLayout(boardLayouts[currentBoardLayout]);
	scheduleNoticeAutoShuffle();
};

const selectNoticeItem = (item) => {
	noticeBoardInteracting = true;
	stopNoticeAutoShuffle();
	noticeBoard.classList.add('has-selection');
	noticeItems.forEach((noticeItem) => noticeItem.classList.toggle('is-selected', noticeItem === item));
};

const clearNoticeSelection = () => {
	noticeBoardInteracting = false;
	noticeBoard.classList.remove('has-selection');
	noticeItems.forEach((item) => item.classList.remove('is-selected'));
	scheduleNoticeAutoShuffle();
};

if (noticeBoard && noticeItems.length) {
	applyBoardLayout(boardLayouts[0]);

	noticeItems.forEach((item) => {
		item.addEventListener('pointerenter', () => selectNoticeItem(item));
		item.addEventListener('focusin', () => selectNoticeItem(item));
		item.addEventListener('pointerleave', (event) => {
			if (!event.relatedTarget || !event.relatedTarget.closest?.('.notice-item')) clearNoticeSelection();
		});
		item.addEventListener('focusout', (event) => {
			if (!item.contains(event.relatedTarget)) clearNoticeSelection();
		});
	});

	if (noticeShuffle) noticeShuffle.addEventListener('click', shuffleBoard);

	const noticeSection = noticeBoard.closest('.gallery-section--board');
	const updateNoticeVisibility = (entries) => {
		const [entry] = entries;
		noticeBoardVisible = entry.isIntersecting;
		if (noticeBoardVisible) scheduleNoticeAutoShuffle();
		else stopNoticeAutoShuffle();
	};

	if ('IntersectionObserver' in window && noticeSection) {
		const noticeObserver = new IntersectionObserver(updateNoticeVisibility, { threshold: 0.2 });
		noticeObserver.observe(noticeSection);
	} else {
		noticeBoardVisible = true;
		scheduleNoticeAutoShuffle();
	}
}

const routineArea = document.querySelector('[data-routine-area]');
const routineTrack = document.querySelector('[data-routine-track]');
const routineCards = routineTrack ? routineTrack.querySelectorAll('[data-routine-card]') : [];
const routineTime = document.querySelector('[data-routine-time]');
const routineMoment = document.querySelector('[data-routine-moment]');
const routineDots = document.querySelectorAll('[data-routine-dot]');
const routineTab = document.querySelector('[data-section-tab="section-routine"]');

if (routineArea && routineTrack && routineCards.length) {
	const routineSticky = routineArea.querySelector('.routine-sticky');
	const routineViewport = routineArea.querySelector('.routine-viewport');
	const routineMoments = [
		{ time: '08:10 AM', label: 'First steps' },
		{ time: '10:45 AM', label: 'Between classes' },
		{ time: '01:20 PM', label: 'Lunch break' },
		{ time: '06:40 PM', label: 'Dinner' },
		{ time: '11:58 PM', label: 'End-of-day chores' }
	];
	let routineFrame = null;

	const updateRoutineLayout = () => {
		const firstCard = routineCards[0];
		if (!firstCard.offsetWidth || !routineViewport.clientWidth) return;
		const sidePadding = Math.max(24, (routineViewport.clientWidth - firstCard.offsetWidth) / 2);
		routineTrack.style.paddingInline = `${sidePadding}px`;
	};

	const updateRoutineScroll = () => {
		routineFrame = null;
		const scrollRange = Math.max(1, routineArea.offsetHeight - routineSticky.offsetHeight);
		const areaTop = routineArea.getBoundingClientRect().top;
		const progress = Math.max(0, Math.min(1, -areaTop / scrollRange));
		const maxTravel = Math.max(0, routineTrack.scrollWidth - routineViewport.clientWidth);
		const position = progress * (routineCards.length - 1);
		const activeIndex = Math.round(position);

		routineTrack.style.transform = `translate3d(${-maxTravel * progress}px, 0, 0)`;
		routineCards.forEach((card, index) => {
			const focus = Math.max(0, 1 - Math.abs(position - index));
			card.style.setProperty('--routine-focus', focus.toFixed(3));
			card.classList.toggle('is-active', index === activeIndex);
		});
		routineTime.textContent = routineMoments[activeIndex].time;
		routineMoment.textContent = routineMoments[activeIndex].label;
		routineDots.forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
	};

	const requestRoutineUpdate = () => {
		if (routineFrame !== null) return;
		routineFrame = requestAnimationFrame(updateRoutineScroll);
	};

	window.addEventListener('scroll', requestRoutineUpdate, { passive: true });
	window.addEventListener('resize', () => {
		updateRoutineLayout();
		requestRoutineUpdate();
	});
	routineTab?.addEventListener('click', () => {
		requestAnimationFrame(() => {
			updateRoutineLayout();
			requestRoutineUpdate();
		});
	});

	updateRoutineLayout();
	requestRoutineUpdate();
}