import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { $el } from "../../../scripts/ui.js";
import { lightbox } from "./common/lightbox.js";

const id = "pysssss.ShowImageOnMenu";
const ext = {
	name: id,
	async setup(app) {
		let enabled = true;
		let autoShow = false;
		let nodeId = null;
		let openInLightbox = false;
		let autoShowButton;
		const getImageNode = () => app.graph.getNodeById(nodeId) ?? app.graph.getNodeById(Number(nodeId));
		const getImageKey = (src) => {
			try {
				const url = new URL(src, location.href);
				const params = url.searchParams;
				return JSON.stringify([params.get("filename"), params.get("type"), params.get("subfolder")]);
			} catch {
				return src;
			}
		};
		const img = $el("img", {
			style: {
				width: "100%",
				height: "150px",
				objectFit: "contain",
			},
			onload: () => {
				if (!autoShow || !openInLightbox) return;
				setTimeout(() => {
					if (lightbox.images?.length) {
						const imageKey = getImageKey(img.src);
						const images = lightbox.images.filter((src) => getImageKey(src) !== imageKey);
						if (lightbox.direction === "newest first") {
							images.unshift(img.src);
							lightbox.index = 0;
						} else {
							images.push(img.src);
							lightbox.index = images.length - 1;
						}
						lightbox.images = images;
						void lightbox.update(0);
					} else {
						void lightbox.show([img.src], 0);
					}
				}, 0);
			},
		});
		const link = $el(
			"a",
			{
				style: {
					width: "100%",
					height: "150px",
					marginTop: "10px",
					order: 100, // Place this item last (until someone else has a higher order)
					display: "none",
				},
				href: "#",
				onclick: (e) => {
					e.stopPropagation();
					e.preventDefault();
					const node = getImageNode();
					if (!node) return;
					app.canvas.centerOnNode(node);
					app.canvas.setZoom(1);
				},
			},
			[img]
		);

		app.ui.menuContainer.append(link);
		autoShowButton = $el("button", {
			type: "button",
			textContent: "Auto",
			title: "Automatically show new final images",
			ariaPressed: "false",
			onclick: () => setAutoShow(!autoShow),
		});
		app.ui.menuContainer.append(autoShowButton);

		const setAutoShow = (value) => {
			autoShow = !!value;
			autoShowButton.textContent = autoShow ? "Auto: ON" : "Auto: OFF";
			autoShowButton.ariaPressed = String(autoShow);
			autoShowButton.classList.toggle("active", autoShow);
			lightbox.setAutoShow(autoShow);
		};
		addEventListener("keydown", (event) => {
			if (event.code !== "Space" || (event.target instanceof HTMLElement && event.target.matches("input, textarea, select, button, [contenteditable='true']"))) return;
			event.preventDefault();
			setAutoShow(!autoShow);
		});

		const show = (src, node, shouldOpenInLightbox) => {
			const lightboxWasOpen = lightbox.el.style.display !== "none" && lightbox.el.style.opacity !== "0";
			const newestFirst = lightbox.direction === "newest first";
			const currentIndex = lightbox.index;
			const latestIndex = newestFirst ? 0 : (lightbox.images?.length ?? 0) - 1;
			const newImageKey = getImageKey(src);
			const feedAlreadyUpdated = lightbox.images?.length
				&& ((newestFirst && getImageKey(lightbox.images[0]) === newImageKey && currentIndex === 1) ||
					(!newestFirst && getImageKey(lightbox.images[lightbox.images.length - 1]) === newImageKey && currentIndex === lightbox.images.length - 2));
			const showingLatest = currentIndex === latestIndex || feedAlreadyUpdated;
			nodeId = node;
			openInLightbox = shouldOpenInLightbox && lightboxWasOpen && showingLatest;
			link.style.display = "unset";
			img.src = src;
		};

		api.addEventListener("executed", ({ detail }) => {
			if (!enabled) return;
			const images = detail?.output?.images;
			if (!images || !images.length) return;
			const format = app.getPreviewFormatParam();
			const src = [
				`./view?filename=${encodeURIComponent(images[0].filename)}`,
				`type=${images[0].type}`,
				`subfolder=${encodeURIComponent(images[0].subfolder)}`,
				`t=${+new Date()}${format}`,].join('&');
			show(src, detail.node, true);
		});

		api.addEventListener("b_preview", ({ detail }) => {
			if (!enabled) return;
			show(URL.createObjectURL(detail), app.runningNodeId, false);
		});

		app.ui.settings.addSetting({
			id,
			name: "🐍 Show Image On Menu",
			defaultValue: true,
			type: "boolean",
			onChange(value) {
				enabled = value;

				if (!enabled) link.style.display = "none";
			},
		});

		app.ui.settings.addSetting({
			id: `${id}.AutoShow`,
			name: "🐍 Automatically Show New Image",
			defaultValue: false,
			type: "boolean",
			onChange(value) {
				setAutoShow(value);
			},
		});
		setAutoShow(app.ui.settings.getSettingValue(`${id}.AutoShow`, false));
	},
};

app.registerExtension(ext);
