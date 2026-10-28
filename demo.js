/* Демо-данные. Все пароли и адреса вымышленные (домены .example). */
(function () {
  'use strict';
  var n = 0;
  function id() { return 'demo' + (++n) + '-' + Math.random().toString(36).slice(2, 8); }
  function day(offset) {
    var d = new Date(); d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function link(title, url, category) { return { id: id(), title: title, url: url, category: category }; }
  function acc(service, url, login, password, note2fa, comment) {
    return { id: id(), service: service, url: url, login: login, password: password, note2fa: note2fa || '', comment: comment || '' };
  }
  function log(offset, text) { return { id: id(), date: day(offset), text: text }; }
  function project(name, url, type, status, tech, links, accesses, logs) {
    return { id: id(), name: name, url: url, type: type, status: status, tech: tech, links: links, accesses: accesses, log: logs };
  }
  function client(f, projects) {
    return Object.assign({ id: id(), demo: true, company: '', phone: '', telegram: '', email: '', notes: '', status: 'active', tags: [], projects: projects }, f);
  }

  window.makeDemo = function () {
    var clients = [
      client({
        name: 'Алексей Морозов', company: 'Морозов Строй', phone: '+7 900 000-01-01', telegram: '@alexey_demo',
        email: 'alexey@morozov-stroy.example', status: 'active', tags: ['строительство', 'приоритет'],
        notes: 'Пишет в Telegram после 18:00. Правки присылает списком, оплата по 1-м числам.'
      }, [
        project('Сайт компании', 'https://morozov-stroy.example', 'site', 'active',
          { hosting: 'Beget, тариф «Блог»', registrar: 'REG.RU', stack: 'WordPress 6, тема на заказ', domainRenewal: day(11), hostingRenewal: day(48) },
          [
            link('Макет сайта', 'https://figma.example/file/morozov-site', 'design'),
            link('Бриф и договор', 'https://drive.example/folders/morozov', 'docs'),
            link('Яндекс Метрика', 'https://metrika.example/counter/10000001', 'analytics'),
            link('Репозиторий темы', 'https://github.example/demo/morozov-theme', 'repo'),
            link('Админка сайта', 'https://morozov-stroy.example/wp-admin', 'other')
          ],
          [
            acc('Хостинг Beget', 'https://hosting.example/login', 'morozov_host', 'DEMO-host-0001-fake', 'Код приходит на почту клиента', 'Основной аккаунт на клиенте'),
            acc('Админка сайта', 'https://morozov-stroy.example/wp-admin', 'admin_demo', 'DEMO-admin-0002-fake', '', 'Права администратора'),
            acc('Почта домена', 'https://mail.example', 'info@morozov-stroy.example', 'DEMO-mail-0003-fake', '2FA отключена', '')
          ],
          [log(-2, 'Алексей просил новый баннер на главную'), log(-15, 'Сменил тариф хостинга на «Блог»')]),
        project('Интернет-магазин', 'https://shop.morozov-stroy.example', 'shop', 'active',
          { hosting: 'Timeweb Cloud', registrar: 'REG.RU', stack: 'OpenCart 3', domainRenewal: day(95), hostingRenewal: day(22) },
          [
            link('Макет каталога', 'https://figma.example/file/morozov-shop', 'design'),
            link('Метрика магазина', 'https://metrika.example/counter/10000002', 'analytics'),
            link('Директ, кабинет', 'https://direct.example/campaigns', 'ads')
          ],
          [acc('Админка магазина', 'https://shop.morozov-stroy.example/admin', 'shop_admin', 'DEMO-shop-0004-fake', 'Приложение-аутентификатор у клиента', '')],
          [log(-6, 'Подключил оплату картой, ждём тестовый платёж')])
      ]),
      client({
        name: 'Мария Ковалёва', company: 'Студия йоги «Выдох»', phone: '+7 900 000-02-02', telegram: '@maria_demo',
        email: 'maria@vydoh.example', status: 'active', tags: ['услуги', 'реклама']
      }, [
        project('Лендинг на запись', 'https://vydoh.example', 'landing', 'active',
          { hosting: 'Tilda', registrar: 'Reg.ru', stack: 'Tilda', domainRenewal: day(-3), hostingRenewal: '' },
          [
            link('Макет лендинга', 'https://figma.example/file/vydoh', 'design'),
            link('Метрика', 'https://metrika.example/counter/10000003', 'analytics')
          ],
          [acc('Tilda', 'https://tilda.example/login', 'maria@vydoh.example', 'DEMO-tilda-0005-fake', 'SMS на номер Марии', '')],
          [log(-1, 'Домен просрочен, жду оплату от Марии')]),
        project('Реклама в Директе', 'https://direct.example/vydoh', 'ads', 'active',
          { hosting: '', registrar: '', stack: 'Яндекс Директ', domainRenewal: '', hostingRenewal: '' },
          [link('Отчёт по кампаниям', 'https://drive.example/reports/vydoh', 'docs')],
          [acc('Яндекс Директ', 'https://direct.example/login', 'vydoh_ads', 'DEMO-direct-0006-fake', '', 'Агентский доступ')],
          [])
      ]),
      client({
        name: 'Дмитрий Орлов', company: 'Орлов Логистик', phone: '+7 900 000-03-03', telegram: '@dorlov_demo',
        email: 'd.orlov@orlov-log.example', status: 'paused', tags: ['b2b'],
        notes: 'Пауза до весны, вернуться к редизайну.'
      }, [
        project('Корпоративный сайт', 'https://orlov-log.example', 'site', 'paused',
          { hosting: 'VPS Selectel', registrar: 'Рег.ру', stack: 'Next.js, Node 20', domainRenewal: day(160), hostingRenewal: day(160) },
          [link('Репозиторий', 'https://github.example/demo/orlov-site', 'repo')],
          [acc('VPS (SSH)', 'ssh://203.0.113.10', 'deploy', 'DEMO-vps-0007-fake', 'Вход только по ключу', 'Порт 2222')],
          [log(-40, 'Поставил сайт на паузу по просьбе клиента')])
      ]),
      client({
        name: 'Анна Белова', company: 'Кофейня «Зерно»', phone: '', telegram: '@anna_zerno_demo',
        email: 'anna@zerno.example', status: 'archive', tags: ['общепит']
      }, [
        project('Сайт-визитка', 'https://zerno.example', 'site', 'done',
          { hosting: 'Beget', registrar: 'Beget', stack: 'Tilda', domainRenewal: '', hostingRenewal: '' },
          [], [], [log(-200, 'Проект сдан, доступы переданы клиенту')])
      ])
    ];
    return { v: 1, clients: clients, recent: [] };
  };
})();
