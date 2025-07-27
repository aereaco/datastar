class AppSidebar extends HTMLElement {
    constructor() {
      super();
  
      this.innerHTML = `
        <aside id="sidebar" class="flex flex-col bg-slate-900 h-screen"
            x-data="{ activeTab: 1 }"
            x-init="
                $watch('sidebarOpen', value => { if (!value && !sidebarHovered) activeTab = 1; });
                $watch('sidebarHovered', value => { if (!value && !sidebarOpen) activeTab = 1; });
            "
        >
            <div class="flex">
                <div class="brand grow">
                    <svg class="emblem max-w-[2rem]" alt="emblem" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" width="40.041" height="40.041" version="1.1" viewBox="0 0 10.594 10.594">
                        <metadata>
                        <rdf:RDF>
                        <cc:Work rdf:about="">
                        <dc:format>image/svg+xml</dc:format>
                        <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
                        </cc:Work>
                        </rdf:RDF>
                        </metadata>
                        <g transform="translate(-42.525 -200.67)">
                        <g transform="matrix(.66735 0 0 .66735 -88.919 71.304)" style="fill:#c4c4c4">
                        <path d="m196.97 201.78c0 4.3897 3.5478 7.9375 7.9375 7.9375 4.3897 0 7.9375-3.5478 7.9375-7.9375 0-4.3897-3.5478-7.9375-7.9375-7.9375-4.3897 0-7.9375 3.5598-7.9375 7.9375zm1.757 3.1575c0-0.63138 0.50511-1.1365 1.1365-1.1365 0.6314 0 1.1365 0.5051 1.1365 1.1365 0 0.63135-0.50513 1.1364-1.1365 1.1364-0.63141 0-1.1365-0.5051-1.1365-1.1364zm1.7679-3.0306c0-0.63136 0.50513-1.1365 1.1365-1.1365 0.6314 0 1.1365 0.5051 1.1365 1.1365 0 0.63137-0.50512 1.1365-1.1365 1.1365-0.63141 0-1.1365-0.50509-1.1365-1.1365zm1.5154 3.0306c0-0.63138 0.50513-1.1365 1.1365-1.1365s1.1366 0.5051 1.1366 1.1365c0 0.63135-0.50515 1.1364-1.1366 1.1364s-1.1365-0.5051-1.1365-1.1364zm0-6.0611c0-0.63136 0.50513-1.1364 1.1365-1.1364s1.1366 0.50508 1.1366 1.1364c0 0.63138-0.50515 1.1365-1.1366 1.1365s-1.1365-0.50508-1.1365-1.1365zm1.7679 3.0306c0-0.63136 0.50515-1.1365 1.1365-1.1365 0.63141 0 1.1366 0.5051 1.1366 1.1365 0 0.63137-0.50514 1.1365-1.1366 1.1365-0.63138 0-1.1365-0.50509-1.1365-1.1365zm3.4e-4 -6.0611c0-0.63137 0.50515-1.1365 1.1365-1.1365 0.6314 0 1.1365 0.5051 1.1365 1.1365 0 0.63136-0.50513 1.1364-1.1365 1.1364-0.63139 0-1.1365-0.50508-1.1365-1.1364zm1.7676 9.0916c0-0.63138 0.50514-1.1365 1.1365-1.1365s1.1365 0.5051 1.1365 1.1365c0 0.63135-0.50513 1.1364-1.1365 1.1364s-1.1365-0.5051-1.1365-1.1364zm0-6.0611c0-0.63136 0.50514-1.1364 1.1365-1.1364s1.1365 0.50508 1.1365 1.1364c0 0.63138-0.50513 1.1365-1.1365 1.1365s-1.1365-0.50508-1.1365-1.1365zm1.5154 3.0306c0-0.63136 0.50513-1.1365 1.1365-1.1365 0.6314 0 1.1365 0.5051 1.1365 1.1365 0 0.63137-0.50511 1.1365-1.1365 1.1365-0.63141 0-1.1365-0.50509-1.1365-1.1365zm1.7679 3.0306c0-0.63138 0.50511-1.1365 1.1365-1.1365s1.1365 0.5051 1.1365 1.1365c0 0.63135-0.50512 1.1364-1.1365 1.1364s-1.1365-0.5051-1.1365-1.1364z" style="fill:#c4c4c4;stroke-width:.12026"/>
                        </g>
                        </g>
                    </svg>
                    <svg class="logo max-w-[9.6rem]" alt="logo" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" width="193.5" height="40.041" version="1.1" viewBox="0 0 51.196 10.594">
                        <metadata>
                        <rdf:RDF>
                        <cc:Work rdf:about="">
                        <dc:format>image/svg+xml</dc:format>
                        <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
                        </cc:Work>
                        </rdf:RDF>
                        </metadata>
                        <g transform="translate(-42.525 -200.67)">
                        <g transform="matrix(.22863 0 0 .22863 43.307 163.58)" style="fill:#c4c4c4" aria-label="Aerea">
                        <path d="m80.799 208.1-5.0309-13.504h-23.83l-4.9647 13.504h-2.5154q2.7802-7.5463 5.0309-13.57 2.3168-6.0238 4.4351-11.319 2.1845-5.3618 4.3027-10.393 2.1845-5.0309 4.6999-10.591h1.8535q2.5816 5.5604 4.7661 10.591 2.1845 5.0309 4.3027 10.393 2.1845 5.2956 4.5013 11.319 2.3168 6.0238 5.0971 13.57zm-5.8252-15.755q-1.5887-4.1703-2.9126-7.4139-1.2577-3.3098-2.5154-6.3548-1.2577-3.1112-2.6478-6.2886-1.3901-3.1774-3.1112-7.1491-1.7211 4.1041-3.1112 7.3477-1.3239 3.1774-2.5816 6.2224-1.2577 3.045-2.5154 6.2886-1.2577 3.2436-2.7802 7.3477z" style="fill:#c4c4c4;stroke-width:.34477"/>
                        <path d="m113.58 206.51q-1.3901 0.86055-3.8393 1.4563-2.4492 0.59576-4.8985 0.59576-8.4068 0-12.445-4.4351-4.0379-4.5013-4.0379-13.769 0-3.2436 0.92674-6.2886 0.92674-3.045 2.714-5.428 1.8535-2.383 4.5675-3.8393 2.7802-1.4563 6.421-1.4563 3.3098 0 5.759 1.1915 2.4492 1.1915 4.0379 3.3098 1.5887 2.0521 2.383 4.8323 0.79434 2.7802 0.79434 5.9576 0 0.59576-0.0662 1.2577 0 0.59576-0.0662 1.1915h-25.088q0.13239 7.8773 3.5746 11.65 3.5084 3.707 10.591 3.707 2.3168 0 4.5675-0.52957 2.2506-0.59576 3.5746-1.3901zm0-17.409q0-6.7519-2.8464-10.194-2.7802-3.4422-7.7449-3.4422-2.9126 0-5.0971 1.1253-2.1845 1.1253-3.7731 3.045-1.5225 1.8535-2.383 4.3689-0.79435 2.4492-0.99293 5.097z" style="fill:#c4c4c4;stroke-width:.34477"/>
                        <path d="m128.41 208.1h-2.2506v-32.237q2.383-1.1915 4.9647-1.7873 2.6478-0.59576 5.2956-0.59576 3.8394 0 6.09 0.86055l-0.46336 1.9859q-0.99294-0.33097-2.5154-0.52956-1.5225-0.19859-3.2436-0.19859-1.9859 0-4.1041 0.46337-2.0521 0.39717-3.7732 1.1915z" style="fill:#c4c4c4;stroke-width:.34477"/>
                        <path d="m172.79 206.51q-1.3901 0.86055-3.8393 1.4563-2.4492 0.59576-4.8985 0.59576-8.4068 0-12.445-4.4351-4.0379-4.5013-4.0379-13.769 0-3.2436 0.92674-6.2886 0.92673-3.045 2.714-5.428 1.8535-2.383 4.5675-3.8393 2.7802-1.4563 6.421-1.4563 3.3098 0 5.759 1.1915 2.4492 1.1915 4.0379 3.3098 1.5887 2.0521 2.383 4.8323 0.79434 2.7802 0.79434 5.9576 0 0.59576-0.0662 1.2577 0 0.59576-0.0662 1.1915h-25.088q0.13239 7.8773 3.5746 11.65 3.5084 3.707 10.591 3.707 2.3168 0 4.5675-0.52957 2.2506-0.59576 3.5746-1.3901zm0-17.409q0-6.7519-2.8464-10.194-2.7802-3.4422-7.7449-3.4422-2.9126 0-5.097 1.1253-2.1845 1.1253-3.7732 3.045-1.5225 1.8535-2.383 4.3689-0.79435 2.4492-0.99293 5.097z" style="fill:#c4c4c4;stroke-width:.34477"/>
                        <path d="m204.7 191.29q-1.5887-0.59576-3.5746-0.92674-1.9859-0.33098-4.3689-0.33098-11.518 0-11.518 8.0759 0 4.2365 2.6478 6.2886 2.714 1.9859 8.4068 1.9859 1.9859 0 4.1703-0.19858 2.2506-0.26479 4.2365-0.79435zm2.2506 15.688q-2.4492 0.72815-5.3618 1.1253-2.8464 0.39717-5.6266 0.39717-6.4872 0-9.7969-2.5816-3.3098-2.6478-3.3098-7.8111 0-4.9647 3.4422-7.4801 3.4422-2.5816 10.393-2.5816 1.9859 0 4.2365 0.39717 2.2506 0.33098 3.7731 0.86054v-2.5816q0-5.9576-2.2506-8.6054-2.1844-2.6478-7.6125-2.6478-2.1183 0-4.3689 0.46337-2.1844 0.39717-3.5084 1.0591l-0.33098-2.1183q3.376-1.5225 8.6054-1.5225 6.09 0 8.8702 3.1774 2.8464 3.1112 2.8464 8.9364z" style="fill:#c4c4c4;stroke-width:.34477"/>
                        </g>
                        <g transform="matrix(.66735 0 0 .66735 -88.919 71.304)" style="fill:#c4c4c4">
                        <path d="m196.97 201.78c0 4.3897 3.5478 7.9375 7.9375 7.9375 4.3897 0 7.9375-3.5478 7.9375-7.9375 0-4.3897-3.5478-7.9375-7.9375-7.9375-4.3897 0-7.9375 3.5598-7.9375 7.9375zm1.757 3.1575c0-0.63138 0.50511-1.1365 1.1365-1.1365 0.6314 0 1.1365 0.5051 1.1365 1.1365 0 0.63135-0.50513 1.1364-1.1365 1.1364-0.63141 0-1.1365-0.5051-1.1365-1.1364zm1.7679-3.0306c0-0.63136 0.50513-1.1365 1.1365-1.1365 0.6314 0 1.1365 0.5051 1.1365 1.1365 0 0.63137-0.50512 1.1365-1.1365 1.1365-0.63141 0-1.1365-0.50509-1.1365-1.1365zm1.5154 3.0306c0-0.63138 0.50513-1.1365 1.1365-1.1365s1.1366 0.5051 1.1366 1.1365c0 0.63135-0.50515 1.1364-1.1366 1.1364s-1.1365-0.5051-1.1365-1.1364zm0-6.0611c0-0.63136 0.50513-1.1364 1.1365-1.1364s1.1366 0.50508 1.1366 1.1364c0 0.63138-0.50515 1.1365-1.1366 1.1365s-1.1365-0.50508-1.1365-1.1365zm1.7679 3.0306c0-0.63136 0.50515-1.1365 1.1365-1.1365 0.63141 0 1.1366 0.5051 1.1366 1.1365 0 0.63137-0.50514 1.1365-1.1366 1.1365-0.63138 0-1.1365-0.50509-1.1365-1.1365zm3.4e-4 -6.0611c0-0.63137 0.50515-1.1365 1.1365-1.1365 0.6314 0 1.1365 0.5051 1.1365 1.1365 0 0.63136-0.50513 1.1364-1.1365 1.1364-0.63139 0-1.1365-0.50508-1.1365-1.1364zm1.7676 9.0916c0-0.63138 0.50514-1.1365 1.1365-1.1365s1.1365 0.5051 1.1365 1.1365c0 0.63135-0.50513 1.1364-1.1365 1.1364s-1.1365-0.5051-1.1365-1.1364zm0-6.0611c0-0.63136 0.50514-1.1364 1.1365-1.1364s1.1365 0.50508 1.1365 1.1364c0 0.63138-0.50513 1.1365-1.1365 1.1365s-1.1365-0.50508-1.1365-1.1365zm1.5154 3.0306c0-0.63136 0.50513-1.1365 1.1365-1.1365 0.6314 0 1.1365 0.5051 1.1365 1.1365 0 0.63137-0.50511 1.1365-1.1365 1.1365-0.63141 0-1.1365-0.50509-1.1365-1.1365zm1.7679 3.0306c0-0.63138 0.50511-1.1365 1.1365-1.1365s1.1365 0.5051 1.1365 1.1365c0 0.63135-0.50512 1.1364-1.1365 1.1364s-1.1365-0.5051-1.1365-1.1364z" style="fill:#c4c4c4;stroke-width:.12026"/>
                        </g>
                        <text x="91.5952" y="211.0238" style="fill:#c4c4c4;font-family:sans-serif;font-size:.48014px;letter-spacing:0px;line-height:1.25;stroke-width:.012004;word-spacing:0px" xml:space="preserve"><tspan x="91.5952" y="211.0238" style="fill:#c4c4c4;font-family:Ubuntu;font-size:2.3046px;font-weight:200;stroke-width:.012004">®</tspan></text>
                        </g>
                    </svg>
                </div>
                <div>
                    <button class="close pt-4 pe-4" @click="sidebarOpen = false">
                        <svg xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-xbox-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 21a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9a9 9 0 0 0 -9 9a9 9 0 0 0 9 9z" /><path d="M9 8l6 8" /><path d="M15 8l-6 8" /></svg>
                    </button>
                </div>
            </div>
            <div class="tabcontent grow size-full">
                <ul x-show="activeTab === 1"  class="menu pt-6">
                    <li>
                    <a class="">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-home"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></svg>
                        <span>Home</span>
                    </a>
                    </li>
                    <li>
                    <details>
                        <summary class="">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-mail"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>
                        <span>Messaging</span>
                        </summary>
                        <ul>
                        <li><details>
                            <summary><span>Email</span></summary>
                            <ul class="transition">
                            <li><a><span>Submenu 1</span></a></li>
                            <li><a><span>Submenu 2</span></a></li>
                            </ul>
                        </details></li>
                        <li><a><span>Chat</span></a></li>
                        <li><a><span>Video Conference</span></a></li>
                        <li>
                            <details>
                            <summary><span>Parent</span></summary>
                            <ul>
                                <li><a><span>Submenu 1</span></a></li>
                                <li><a><span>Submenu 2</span></a></li>
                                <li><details>
                                <summary><span>Parent</span></summary>
                                <ul>
                                    <li><a><span>Submenu 1</span></a></li>
                                    <li><a><span>Submenu 2</span></a></li>
                                </ul>
                                </details></li>
                            </ul>
                            </details>
                        </li>
                        </ul>
                    </details>
                    </li>
                    <li>
                    <a class="">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chart-area"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 19l16 0" /><path d="M4 15l4 -6l4 2l4 -5l4 4l0 5l-16 0" /></svg>
                        <span>Charts</span>
                    </a>
                    </li>
                </ul>
                
                <div class="p-8" x-show="activeTab === 2" x-cloak>
                    <div class="mb-6"><h1 class="text-lg">Favorites</h1></div>
                </div>                
                
                <div class="p-8" x-show="activeTab === 3" x-cloak>
                    <div class="mb-6 whitespace-nowrap"><h1 class="text-lg">Panel Preferences</h1></div>
                    <div class="flex flex-col">
                        <div class="flex flex-nowrap w-52 pe-4">
                            <span class="label-text grow">Text Flow Direction</span>
                            <label class="grid cursor-pointer place-items-center w-10">
                            <input type="checkbox" value="text-direction" @change="direction = $el.checked ? 'rtl' : 'ltr'" class="toggle toggle-primary toggle-lg bg-base-content col-span-2 col-start-1 row-start-1" />
                            <svg class="stroke-base-100 fill-base-100 col-start-1 row-start-1 icon icon-tabler icons-tabler-outline icon-tabler-text-direction-ltr" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 19h14" /><path d="M17 21l2 -2l-2 -2" /><path d="M16 4h-6.5a3.5 3.5 0 0 0 0 7h.5" /><path d="M14 15v-11" /><path d="M10 15v-11" /></svg>
                            <svg class="stroke-base-100 fill-base-100 col-start-2 row-start-1 icon icon-tabler icons-tabler-outline icon-tabler-text-direction-rtl" xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 4h-6.5a3.5 3.5 0 0 0 0 7h.5" /><path d="M14 15v-11" /><path d="M10 15v-11" /><path d="M5 19h14" /><path d="M7 21l-2 -2l2 -2" /></svg>
                            </label>                                            
                        </div>
                        <div class="divider"></div>
                        <div class="form-control w-52">
                            <label class="label cursor-pointer">
                            <span class="label-text">Remember me</span>
                            <input type="checkbox" class="toggle toggle-secondary" checked="checked" />
                            </label>
                        </div>
                        <div class="form-control w-52">
                            <label class="label cursor-pointer">
                            <span class="label-text">Remember me</span>
                            <input type="checkbox" class="toggle toggle-accent" checked="checked" />
                            </label>
                        </div>
                    </div>
                </div>
                
            </div>            
            <div role="tablist" class="tabs tabs-bordered">
                <button role="tab" class="tab h-14 tab-active tooltip" data-tip="Menu" :class="{ 'tab-active': activeTab === 1 }" @click="activeTab = 1">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-menu-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 6l16 0" /><path d="M4 12l16 0" /><path d="M4 18l16 0" /></svg>
                </button>
                <button role="tab" class="tab h-14 tooltip" data-tip="Favorites" :class="{ 'tab-active': activeTab === 2 }" @click="activeTab = 2">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-star"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                </button>
                <button role="tab" class="tab h-14 tooltip" data-tip="Prefereces" :class="{ 'tab-active': activeTab === 3 }" @click="activeTab = 3">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-adjustments-horizontal"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 6l8 0" /><path d="M16 6l4 0" /><path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 12l2 0" /><path d="M10 12l10 0" /><path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M4 18l11 0" /><path d="M19 18l1 0" /></svg>
                </button>
            </div>            
        </aside>

        <style>
            [x-cloak] {
                display: none;
            }

            #sidebar {
                /* more style to come */
                .tabs {
                    /* more style to come */
                    .tab {
                        transition: background-color .3s ease-in-out;
                        border-color: transparent;
                        border-top-width: 2px;
                        border-bottom: none;
                        &.tab-active {
                            /* Add a top border */
                            border-top-color: currentColor; /* Use the current text color for the border */
                        }
                        &:hover {
                            background-color: rgba(255, 255, 255, .2);
                        }
                        svg {
                            margin: 0 auto
                        }
                    }
                }
            }

        </style>
      `;
    }
  }
  
  customElements.define('app-sidebar', AppSidebar);