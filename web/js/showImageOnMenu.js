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
		const img = $el("img", {
			style: {
				width: "100%",
				height: "150px",
				objectFit: "contain",
			},
			onload: () => {
				if (!autoShow || !openInLightbox) return;
				void lightbox.show([img.src], 0);
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
		};

		const show = (src, node, shouldOpenInLightbox) => {
			const lightboxWasOpen = lightbox.el.style.display !== "none" && lightbox.el.style.opacity !== "0";
			nodeId = node;
			openInLightbox = shouldOpenInLightbox && lightboxWasOpen;
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
