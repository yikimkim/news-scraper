   1	// News Scraper App - 키워드 중심 뉴스 수집 애플리케이션
     2	class NewsScraperApp {
     3	    constructor() {
     4	        this.currentPage = 1;
     5	        this.pageSize = 10;
     6	        this.currentKeywordFilter = '';
     7	        this.currentSort = 'scraped_at';
     8	        this.init();
     9	    }
    10	
    11	    // 앱 초기화
    12	    async init() {
    13	        this.bindEvents();
    14	        await this.loadKeywords();
    15	        await this.loadNews();
    16	        await this.updateStats();
    17	    }
    18	
    19	    // 이벤트 바인딩
    20	    bindEvents() {
    21	        // 키워드 관리
    22	        document.getElementById('add-keyword-btn').addEventListener('click', () => this.showAddKeywordForm());
    23	        document.getElementById('save-keyword-btn').addEventListener('click', () => this.saveKeyword());
    24	        document.getElementById('cancel-keyword-btn').addEventListener('click', () => this.hideAddKeywordForm());
    25	        document.getElementById('new-keyword').addEventListener('keypress', (e) => {
    26	            if (e.key === 'Enter') this.saveKeyword();
    27	        });
    28	
    29	        // 뉴스 스크랩
    30	        document.getElementById('scrape-news-btn').addEventListener('click', () => this.scrapeNews());
    31	        
    32	        // 새로고침
    33	        document.getElementById('refresh-btn').addEventListener('click', () => this.refreshAll());
    34	
    35	        // 필터링 및 정렬
    36	        document.getElementById('filter-keywords').addEventListener('change', (e) => {
    37	            this.currentKeywordFilter = e.target.value;
    38	            this.currentPage = 1;
    39	            this.loadNews();
    40	        });
    41	
    42	        document.getElementById('sort-news').addEventListener('change', (e) => {
    43	            this.currentSort = e.target.value;
    44	            this.currentPage = 1;
    45	            this.loadNews();
    46	        });
    47	    }
    48	
    49	    // 키워드 관리 기능
    50	    showAddKeywordForm() {
    51	        document.getElementById('add-keyword-form').classList.remove('hidden');
    52	        document.getElementById('new-keyword').focus();
    53	    }
    54	
    55	    hideAddKeywordForm() {
    56	        document.getElementById('add-keyword-form').classList.add('hidden');
    57	        document.getElementById('new-keyword').value = '';
    58	        document.getElementById('new-keyword-desc').value = '';
    59	    }
    60	
    61	    async saveKeyword() {
    62	        const keyword = document.getElementById('new-keyword').value.trim();
    63	        const description = document.getElementById('new-keyword-desc').value.trim();
    64	
    65	        if (!keyword) {
    66	            this.showToast('키워드를 입력해주세요.', 'error');
    67	            return;
    68	        }
    69	
    70	        try {
    71	            const keywordData = {
    72	                keyword: keyword,
    73	                description: description || '',
    74	                is_active: true,
    75	                created_at: Date.now()
    76	            };
    77	
    78	            const response = await fetch('tables/keywords', {
    79	                method: 'POST',
    80	                headers: { 'Content-Type': 'application/json' },
    81	                body: JSON.stringify(keywordData)
    82	            });
    83	
    84	            if (response.ok) {
    85	                this.hideAddKeywordForm();
    86	                this.showToast('키워드가 추가되었습니다.', 'success');
    87	                await this.loadKeywords();
    88	                await this.updateStats();
    89	            } else {
    90	                throw new Error('키워드 저장 실패');
    91	            }
    92	        } catch (error) {
    93	            console.error('Error saving keyword:', error);
    94	            this.showToast('키워드 저장 중 오류가 발생했습니다.', 'error');
    95	        }
    96	    }
    97	
    98	    async loadKeywords() {
    99	        try {
   100	            const response = await fetch('tables/keywords');
   101	            const data = await response.json();
   102	            this.renderKeywords(data.data || []);
   103	            this.updateKeywordFilter(data.data || []);
   104	        } catch (error) {
   105	            console.error('Error loading keywords:', error);
   106	            this.showToast('키워드 로딩 중 오류가 발생했습니다.', 'error');
   107	        }
   108	    }
   109	
   110	    renderKeywords(keywords) {
   111	        const container = document.getElementById('keywords-list');
   112	        
   113	        if (keywords.length === 0) {
   114	            container.innerHTML = `
   115	                <div class="text-center text-gray-500 py-8">
   116	                    <i class="fas fa-search text-4xl mb-4"></i>
   117	                    <p>등록된 키워드가 없습니다.</p>
   118	                    <p class="text-sm">키워드를 추가하여 뉴스 수집을 시작하세요.</p>
   119	                </div>
   120	            `;
   121	            return;
   122	        }
   123	
   124	        const keywordItems = keywords.map(keyword => `
   125	            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
   126	                <div class="flex-1">
   127	                    <div class="flex items-center space-x-2">
   128	                        <span class="px-2 py-1 text-sm rounded-full ${keyword.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
   129	                            ${keyword.keyword}
   130	                        </span>
   131	                        ${keyword.is_active ? '<i class="fas fa-check-circle text-green-500 text-sm"></i>' : '<i class="fas fa-pause-circle text-gray-400 text-sm"></i>'}
   132	                    </div>
   133	                    ${keyword.description ? `<p class="text-xs text-gray-500 mt-1">${keyword.description}</p>` : ''}
   134	                </div>
   135	                <div class="flex items-center space-x-2">
   136	                    <button onclick="app.toggleKeyword('${keyword.id}')" 
   137	                            class="p-1 rounded hover:bg-gray-200 transition-colors duration-200" 
   138	                            title="${keyword.is_active ? '비활성화' : '활성화'}">
   139	                        <i class="fas ${keyword.is_active ? 'fa-pause' : 'fa-play'} text-sm text-gray-600"></i>
   140	                    </button>
   141	                    <button onclick="app.deleteKeyword('${keyword.id}')" 
   142	                            class="p-1 rounded hover:bg-red-100 transition-colors duration-200 text-red-500" 
   143	                            title="삭제">
   144	                        <i class="fas fa-trash text-sm"></i>
   145	                    </button>
   146	                </div>
   147	            </div>
   148	        `).join('');
   149	
   150	        container.innerHTML = keywordItems;
   151	    }
   152	
   153	    updateKeywordFilter(keywords) {
   154	        const select = document.getElementById('filter-keywords');
   155	        const currentValue = select.value;
   156	        
   157	        select.innerHTML = '<option value="">모든 키워드</option>' +
   158	            keywords.map(keyword => 
   159	                `<option value="${keyword.keyword}" ${currentValue === keyword.keyword ? 'selected' : ''}>${keyword.keyword}</option>`
   160	            ).join('');
   161	    }
   162	
   163	    async toggleKeyword(keywordId) {
   164	        try {
   165	            // 먼저 현재 키워드 데이터를 가져옵니다
   166	            const response = await fetch(`tables/keywords/${keywordId}`);
   167	            const keyword = await response.json();
   168	            
   169	            // 활성화 상태를 토글합니다
   170	            const updateResponse = await fetch(`tables/keywords/${keywordId}`, {
   171	                method: 'PATCH',
   172	                headers: { 'Content-Type': 'application/json' },
   173	                body: JSON.stringify({ is_active: !keyword.is_active })
   174	            });
   175	
   176	            if (updateResponse.ok) {
   177	                this.showToast(`키워드가 ${keyword.is_active ? '비활성화' : '활성화'}되었습니다.`, 'success');
   178	                await this.loadKeywords();
   179	                await this.updateStats();
   180	            }
   181	        } catch (error) {
   182	            console.error('Error toggling keyword:', error);
   183	            this.showToast('키워드 상태 변경 중 오류가 발생했습니다.', 'error');
   184	        }
   185	    }
   186	
   187	    async deleteKeyword(keywordId) {
   188	        if (!confirm('정말로 이 키워드를 삭제하시겠습니까?')) {
   189	            return;
   190	        }
   191	
   192	        try {
   193	            const response = await fetch(`tables/keywords/${keywordId}`, {
   194	                method: 'DELETE'
   195	            });
   196	
   197	            if (response.ok) {
   198	                this.showToast('키워드가 삭제되었습니다.', 'success');
   199	                await this.loadKeywords();
   200	                await this.updateStats();
   201	            }
   202	        } catch (error) {
   203	            console.error('Error deleting keyword:', error);
   204	            this.showToast('키워드 삭제 중 오류가 발생했습니다.', 'error');
   205	        }
   206	    }
   207	
   208	    // 뉴스 스크랩 기능
   209	    async scrapeNews() {
   210	        try {
   211	            // 활성화된 키워드 가져오기
   212	            const keywordsResponse = await fetch('tables/keywords');
   213	            const keywordsData = await keywordsResponse.json();
   214	            const activeKeywords = (keywordsData.data || []).filter(k => k.is_active);
   215	
   216	            if (activeKeywords.length === 0) {
   217	                this.showToast('활성화된 키워드가 없습니다.', 'warning');
   218	                return;
   219	            }
   220	
   221	            this.showLoading(true);
   222	
   223	            // 각 키워드에 대해 뉴스 스크랩 (데모용 시뮬레이션)
   224	            const scrapedArticles = [];
   225	            
   226	            for (const keyword of activeKeywords) {
   227	                // 실제 뉴스 API 연동 대신 데모 데이터 생성
   228	                const demoArticles = this.generateDemoNews(keyword.keyword, 3);
   229	                scrapedArticles.push(...demoArticles);
   230	            }
   231	
   232	            // 수집된 뉴스를 데이터베이스에 저장
   233	            for (const article of scrapedArticles) {
   234	                await fetch('tables/news_articles', {
   235	                    method: 'POST',
   236	                    headers: { 'Content-Type': 'application/json' },
   237	                    body: JSON.stringify(article)
   238	                });
   239	            }
   240	
   241	            this.showLoading(false);
   242	            this.showToast(`${scrapedArticles.length}개의 뉴스가 수집되었습니다.`, 'success');
   243	            
   244	            await this.loadNews();
   245	            await this.updateStats();
   246	
   247	        } catch (error) {
   248	            console.error('Error scraping news:', error);
   249	            this.showLoading(false);
   250	            this.showToast('뉴스 수집 중 오류가 발생했습니다.', 'error');
   251	        }
   252	    }
   253	
   254	    // 데모용 뉴스 생성 (실제 환경에서는 뉴스 API 연동)
   255	    generateDemoNews(keyword, count) {
   256	        const demoTitles = [
   257	            `${keyword} 관련 최신 소식이 전해졌습니다`,
   258	            `${keyword} 분야에서 새로운 발전이 있었다고 발표`,
   259	            `${keyword}에 대한 전문가들의 의견이 주목받고 있습니다`,
   260	            `${keyword} 시장 동향과 향후 전망에 대한 분석`,
   261	            `${keyword} 관련 정책 변화가 예상된다는 보고`
   262	        ];
   263	
   264	        const demoSources = ['연합뉴스', '조선일보', '중앙일보', '동아일보', 'MBC', 'KBS', 'SBS'];
   265	        const demoDescriptions = [
   266	            `${keyword}와 관련된 중요한 발표가 있었습니다. 이번 발표는 향후 업계에 큰 영향을 미칠 것으로 예상됩니다.`,
   267	            `전문가들은 ${keyword} 분야의 최근 변화에 대해 긍정적인 평가를 내놓았습니다. 관련 기업들의 주가도 상승세를 보이고 있습니다.`,
   268	            `${keyword}에 대한 새로운 연구 결과가 발표되었습니다. 이는 기존의 통념을 뒤바꿀 만한 획기적인 발견으로 평가받고 있습니다.`
   269	        ];
   270	
   271	        const articles = [];
   272	        for (let i = 0; i < count; i++) {
   273	            const publishedDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // 최근 7일 내
   274	            
   275	            articles.push({
   276	                title: demoTitles[Math.floor(Math.random() * demoTitles.length)],
   277	                description: demoDescriptions[Math.floor(Math.random() * demoDescriptions.length)],
   278	                url: `https://example.com/news/${Date.now()}-${i}`,
   279	                source: demoSources[Math.floor(Math.random() * demoSources.length)],
   280	                published_date: publishedDate.getTime(),
   281	                image_url: 'https://via.placeholder.com/300x200?text=News+Image',
   282	                matched_keywords: [keyword],
   283	                scraped_at: Date.now()
   284	            });
   285	        }
   286	        
   287	        return articles;
   288	    }
   289	
   290	    // 뉴스 로딩 및 표시
   291	    async loadNews() {
   292	        try {
   293	            let url = `tables/news_articles?page=${this.currentPage}&limit=${this.pageSize}&sort=${this.currentSort}`;
   294	            
   295	            const response = await fetch(url);
   296	            const data = await response.json();
   297	            
   298	            let articles = data.data || [];
   299	            
   300	            // 클라이언트 사이드 필터링 (키워드별)
   301	            if (this.currentKeywordFilter) {
   302	                articles = articles.filter(article => 
   303	                    article.matched_keywords && 
   304	                    article.matched_keywords.includes(this.currentKeywordFilter)
   305	                );
   306	            }
   307	
   308	            this.renderNews(articles);
   309	            this.renderPagination(data.total, data.page);
   310	            
   311	        } catch (error) {
   312	            console.error('Error loading news:', error);
   313	            this.showToast('뉴스 로딩 중 오류가 발생했습니다.', 'error');
   314	        }
   315	    }
   316	
   317	    renderNews(articles) {
   318	        const container = document.getElementById('news-list');
   319	        
   320	        if (articles.length === 0) {
   321	            container.innerHTML = `
   322	                <div class="text-center text-gray-500 py-12">
   323	                    <i class="fas fa-newspaper text-4xl mb-4"></i>
   324	                    <p class="text-lg">수집된 뉴스가 없습니다.</p>
   325	                    <p class="text-sm">키워드를 추가하고 뉴스를 수집해보세요.</p>
   326	                </div>
   327	            `;
   328	            return;
   329	        }
   330	
   331	        const newsItems = articles.map(article => {
   332	            const publishedDate = new Date(article.published_date).toLocaleDateString('ko-KR');
   333	            const scrapedDate = new Date(article.scraped_at).toLocaleDateString('ko-KR');
   334	            
   335	            return `
   336	                <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 bg-white">
   337	                    <div class="flex flex-col md:flex-row md:space-x-4">
   338	                        ${article.image_url ? `
   339	                            <div class="md:w-48 md:h-32 mb-4 md:mb-0 flex-shrink-0">
   340	                                <img src="${article.image_url}" 
   341	                                     alt="뉴스 이미지" 
   342	                                     class="w-full h-full object-cover rounded-lg"
   343	                                     onerror="this.style.display='none'">
   344	                            </div>
   345	                        ` : ''}
   346	                        
   347	                        <div class="flex-1">
   348	                            <div class="flex items-start justify-between mb-2">
   349	                                <h3 class="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
   350	                                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" 
   351	                                       class="hover:text-blue-600 transition-colors duration-200">
   352	                                        ${article.title}
   353	                                    </a>
   354	                                </h3>
   355	                            </div>
   356	                            
   357	                            <p class="text-gray-600 mb-3 line-clamp-3">${article.description}</p>
   358	                            
   359	                            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
   360	                                <span class="flex items-center">
   361	                                    <i class="fas fa-building mr-1"></i>
   362	                                    ${article.source}
   363	                                </span>
   364	                                <span class="flex items-center">
   365	                                    <i class="fas fa-calendar mr-1"></i>
   366	                                    발행: ${publishedDate}
   367	                                </span>
   368	                                <span class="flex items-center">
   369	                                    <i class="fas fa-download mr-1"></i>
   370	                                    수집: ${scrapedDate}
   371	                                </span>
   372	                            </div>
   373	                            
   374	                            <div class="mt-3 flex flex-wrap gap-2">
   375	                                ${(article.matched_keywords || []).map(keyword => 
   376	                                    `<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">${keyword}</span>`
   377	                                ).join('')}
   378	                            </div>
   379	                        </div>
   380	                    </div>
   381	                </div>
   382	            `;
   383	        }).join('');
   384	
   385	        container.innerHTML = newsItems;
   386	    }
   387	
   388	    renderPagination(total, currentPage) {
   389	        const totalPages = Math.ceil(total / this.pageSize);
   390	        const container = document.getElementById('pagination');
   391	        
   392	        if (totalPages <= 1) {
   393	            container.classList.add('hidden');
   394	            return;
   395	        }
   396	
   397	        container.classList.remove('hidden');
   398	        
   399	        let paginationHTML = '';
   400	        
   401	        // 이전 버튼
   402	        if (currentPage > 1) {
   403	            paginationHTML += `
   404	                <button onclick="app.goToPage(${currentPage - 1})" 
   405	                        class="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
   406	                    이전
   407	                </button>
   408	            `;
   409	        }
   410	        
   411	        // 페이지 번호들
   412	        const startPage = Math.max(1, currentPage - 2);
   413	        const endPage = Math.min(totalPages, currentPage + 2);
   414	        
   415	        for (let i = startPage; i <= endPage; i++) {
   416	            paginationHTML += `
   417	                <button onclick="app.goToPage(${i})" 
   418	                        class="px-3 py-2 ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'} border border-gray-300 rounded-lg">
   419	                    ${i}
   420	                </button>
   421	            `;
   422	        }
   423	        
   424	        // 다음 버튼
   425	        if (currentPage < totalPages) {
   426	            paginationHTML += `
   427	                <button onclick="app.goToPage(${currentPage + 1})" 
   428	                        class="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
   429	                    다음
   430	                </button>
   431	            `;
   432	        }
   433	        
   434	        container.innerHTML = paginationHTML;
   435	    }
   436	
   437	    goToPage(page) {
   438	        this.currentPage = page;
   439	        this.loadNews();
   440	    }
   441	
   442	    // 통계 업데이트
   443	    async updateStats() {
   444	        try {
   445	            const [keywordsResponse, newsResponse] = await Promise.all([
   446	                fetch('tables/keywords'),
   447	                fetch('tables/news_articles')
   448	            ]);
   449	
   450	            const keywordsData = await keywordsResponse.json();
   451	            const newsData = await newsResponse.json();
   452	
   453	            const keywords = keywordsData.data || [];
   454	            const news = newsData.data || [];
   455	
   456	            // 오늘 수집된 뉴스 계산
   457	            const today = new Date();
   458	            today.setHours(0, 0, 0, 0);
   459	            const todayNews = news.filter(article => 
   460	                new Date(article.scraped_at) >= today
   461	            );
   462	
   463	            document.getElementById('total-keywords').textContent = keywords.length;
   464	            document.getElementById('active-keywords').textContent = keywords.filter(k => k.is_active).length;
   465	            document.getElementById('total-news').textContent = news.length;
   466	            document.getElementById('today-news').textContent = todayNews.length;
   467	
   468	        } catch (error) {
   469	            console.error('Error updating stats:', error);
   470	        }
   471	    }
   472	
   473	    // 전체 새로고침
   474	    async refreshAll() {
   475	        this.showLoading(true);
   476	        try {
   477	            await Promise.all([
   478	                this.loadKeywords(),
   479	                this.loadNews(),
   480	                this.updateStats()
   481	            ]);
   482	            this.showToast('데이터가 새로고침되었습니다.', 'success');
   483	        } catch (error) {
   484	            console.error('Error refreshing:', error);
   485	            this.showToast('새로고침 중 오류가 발생했습니다.', 'error');
   486	        } finally {
   487	            this.showLoading(false);
   488	        }
   489	    }
   490	
   491	    // UI 유틸리티 메서드
   492	    showLoading(show) {
   493	        const modal = document.getElementById('loading-modal');
   494	        if (show) {
   495	            modal.classList.remove('hidden');
   496	        } else {
   497	            modal.classList.add('hidden');
   498	        }
   499	    }
   500	
   501	    showToast(message, type = 'info') {
   502	        const container = document.getElementById('toast-container');
   503	        const toastId = 'toast-' + Date.now();
   504	        
   505	        const typeClasses = {
   506	            success: 'bg-green-500',
   507	            error: 'bg-red-500',
   508	            warning: 'bg-yellow-500',
   509	            info: 'bg-blue-500'
   510	        };
   511	
   512	        const toast = document.createElement('div');
   513	        toast.id = toastId;
   514	        toast.className = `${typeClasses[type]} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;
   515	        toast.innerHTML = `
   516	            <div class="flex items-center justify-between">
   517	                <span>${message}</span>
   518	                <button onclick="document.getElementById('${toastId}').remove()" class="ml-4 text-white hover:text-gray-200">
   519	                    <i class="fas fa-times"></i>
   520	                </button>
   521	            </div>
   522	        `;
   523	
   524	        container.appendChild(toast);
   525	
   526	        // 애니메이션
   527	        setTimeout(() => {
   528	            toast.classList.remove('translate-x-full', 'opacity-0');
   529	        }, 100);
   530	
   531	        // 자동 제거
   532	        setTimeout(() => {
   533	            if (toast.parentNode) {
   534	                toast.classList.add('translate-x-full', 'opacity-0');
   535	                setTimeout(() => toast.remove(), 300);
   536	            }
   537	        }, 5000);
   538	    }
   539	}
   540	
   541	// 앱 초기화
   542	let app;
   543	document.addEventListener('DOMContentLoaded', () => {
   544	    app = new NewsScraperApp();
   545	});
   546	
   547	// CSS 유틸리티 클래스 추가
   548	const style = document.createElement('style');
   549	style.textContent = `
   550	    .line-clamp-2 {
   551	        display: -webkit-box;
   552	        -webkit-line-clamp: 2;
   553	        -webkit-box-orient: vertical;
   554	        overflow: hidden;
   555	    }
   556	    .line-clamp-3 {
   557	        display: -webkit-box;
   558	        -webkit-line-clamp: 3;
   559	        -webkit-box-orient: vertical;
   560	        overflow: hidden;
   561	    }
   562	`;
   563	document.head.appendChild(style);
