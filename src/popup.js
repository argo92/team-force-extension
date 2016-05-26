$(function() {
	const poolsList = Handlebars.compile($('#poolsList').html());
	const ddp       = new DDPClient('ws://localhost:3000/websocket');

	let feedsCounter = 0;
	let isLogin = false;

	$('#submit').bind('click', function (event) {
		event.preventDefault();

		const email = $('#email').val();
		const psswd = $('#password').val();

		// Сознательно сделано так.
		// Понимаю, что это не безопасно.
		// Понимаю, что пароли в открытом виде это грех.
		// Понимаю, что при Сталине за такое отправляли в Сибирь.
		localStorage.setItem("email", email);
		localStorage.setItem("psswd", psswd);

		startSession();
		render();

	});

	$('#logout').bind('click', function (event) {
		event.preventDefault();
		ddp.call('logout');
		localStorage.setItem("email", undefined);
		localStorage.setItem("psswd", undefined);
		isLogin = false;
		render();
	});

	ddp.connect().then(() => {
		console.log('Connected!');
		startSession();
	});

	function startSession() {
		let email = localStorage.getItem("email");
		let psswd = localStorage.getItem("psswd");

		if (!!email && !!psswd){
			let loginParams = {'password': psswd,'user':{'email':email}};
			ddp.call('login', loginParams)
				.then(res => {
					ddp.call('whoami').then(currentUser => {
						ddp.call('extension', currentUser._id, currentUser.profile.company).then(data => {
							poolsWithDates = data.poolsWithDates;

							$('#debtsValue').html(data.paidOrdersPrice);
							$('#feedsValue').html(data.feedsUnseenCount);
							$('#usermailValue').html(data.currentUsermail)
							$('#userId').val(data.currentUser._id);

							render();
						});
						isLogin = true;
						render();
					});
				}).catch(e => {
					console.log(e);
				});
		}
	}

	let poolsWithDates = [];

	function render() {

		const context    = {poolsWithDates};
		const html       = poolsList(context);
		const loginClass = 'isLogin';

		if (isLogin) {
			$('body').addClass(loginClass);
		}else{
			$('body').removeClass(loginClass);
		}

		$('.body').html(html);

		$('.pool').bind('click', function (event) {
			event.preventDefault();
			let $this = $(this);
			const procClass = 'pool_processing';

			if (!$this.hasClass(procClass)){
				$this.addClass(procClass);
				const poolId = $this.data('poolid');
				const userId = $('#userId').val();

				function closureTabLink(currentUrl) {
					ddp.call('appendItemFromLink', poolId, userId, currentUrl)
						.then(res => {
							// Баг неубирающегося класса здесь.
							// Ответ в виде промиса это боль. Точка:(
							// Вероятно, есть более красивое решение ожидания сервера.
							// @TODO
							$this.removeClass(procClass);
							// window.close();
						}).catch(e => {
							console.log(e);
						});
				}

				// chrome fail :(
				// нет у них красивых методов, нужно больше костылей!
				chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, 
					function(tabs) {
				    	closureTabLink(tabs[0].url);
					}
				);

			}

		});
	}

	render();

});
