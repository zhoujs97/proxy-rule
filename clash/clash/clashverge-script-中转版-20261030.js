function main(config) {
  // 建立兜底数组防止报错
  if (!config['proxies']) config['proxies'] = [];

  // ===================================================================
  // 1. 注入自建被墙的 Socks5 落地机，dialer-proxy 指向专属中转策略组
  // ===================================================================
  const myCustomSocks5 = {
    name: "中转落地美国socks5",
    type: "socks5",
    server: "23.144.12.123",             // 你的美国 VPS 真实 IP
    port: 5327,                         // 你的 mixed/socks5 独立端口
    username: "socks5",
    password: "5u287kqak59o",
    udp: true,
    "dialer-proxy": "✈️ 落地机前置中转"   // 指向下方的中转策略组
  };

  config['proxies'].unshift(myCustomSocks5);

  const allProxyNames = config['proxies'].map(p => p.name);
  const providers = config['proxy-providers'] ? Object.keys(config['proxy-providers']) : [];

  // ===================================================================
  // 2. 声明前置中转策略组（用来选择哪个机场节点帮你的 VPS 做跳板）
  // ===================================================================
  const dialerGroup = {
    name: '✈️ 落地机前置中转',
    type: 'select',
    proxies: ['DIRECT'], // 静态占位，确保校验必过
    use: providers
  };

  // === 3. 扁平化应用策略组 (include-all 自动展开所有自建、机场与中转节点) ===
  const appNames = [
    '🤖 OpenAI',
    '🤖 Claude',
    '🤖 Gemini',
    '❎ Twitter',
    '🕊️ Google',
    '🎬 YouTube',
    '📷 Instagram',
    '📲 Telegram',
    '🎵 TikTok',
    '🌐 国际通用'
  ];

  const appGroups = appNames.map(name => ({
    name: name,
    type: 'select',
    'include-all': true,             // 自动展开所有节点（包括“中转落地美国socks5”）
    proxies: ['DIRECT', 'REJECT']    // 提供直连和阻断兜底选项
  }));

  // === 4. 基础地区策略组 (供底层本地 Listeners 绑定端口使用) ===
  const filterStaticNodes = (reg) => allProxyNames.filter(name => reg.test(name));
  const regionGroups = [
    { name: '🇭🇰 香港节点组', type: 'select', proxies: filterStaticNodes(/香港|Hong Kong|HK|兔兔云/i).concat(['DIRECT']), use: providers, filter: '(?i)香港|Hong Kong|HK|兔兔云' },
    { name: '🇸🇬 新加坡节点组', type: 'select', proxies: filterStaticNodes(/新加坡|Singapore|SG/i).concat(['DIRECT']), use: providers, filter: '(?i)新加坡|Singapore|SG' },
    { name: '🇺🇸 美国节点组', type: 'select', proxies: filterStaticNodes(/美国|USA|US/i).concat(['DIRECT']), use: providers, filter: '(?i)美国|USA|US' },
    { name: '🇯🇵 日本节点组', type: 'select', proxies: filterStaticNodes(/日本|Japan|JP/i).concat(['DIRECT']), use: providers, filter: '(?i)日本|Japan|JP' }
  ];

  // 合并前置中转策略组、各 App 分流组、地区组
  config['proxy-groups'] = [dialerGroup].concat(appGroups).concat(regionGroups);

  // === 5. 本地监听端口 ===
  const myListeners = [
    { name: 'proxy-hk', type: 'socks', port: 7898, proxy: '🇭🇰 香港节点组' },
    { name: 'proxy-sg', type: 'socks', port: 7899, proxy: '🇸🇬 新加坡节点组' },
    { name: 'proxy-usa', type: 'socks', port: 7900, proxy: '🇺🇸 美国节点组' },
    { name: 'proxy-jp', type: 'socks', port: 7901, proxy: '🇯🇵 日本节点组' }
  ];
  
  let currentListeners = config['listeners'] || [];
  const myListenerNames = myListeners.map(l => l.name);
  currentListeners = currentListeners.filter(l => !myListenerNames.includes(l.name));
  config['listeners'] = currentListeners.concat(myListeners);

  // === 6. 引入外部规则集 (Rule Providers) ===
  if (!config['rule-providers']) config['rule-providers'] = {};

  const remoteRules = {
    'OpenAI': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OpenAI/OpenAI.yaml',
    'Claude': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Claude/Claude.yaml',
    'Gemini': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Gemini/Gemini.yaml',
    'Twitter': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Twitter/Twitter.yaml',
    'Google': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Google/Google.yaml',
    'GitHub': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/GitHub/GitHub.yaml',
    'Telegram': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Telegram/Telegram.yaml',
    'YouTube': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/YouTube/YouTube.yaml',
    'Instagram': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Instagram/Instagram.yaml',
    'Spotify': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Spotify/Spotify.yaml',
    'Netflix': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Netflix/Netflix_Classical.yaml',
    'Disney': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Disney/Disney.yaml',
    'PayPal': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/PayPal/PayPal.yaml',
    'Amazon': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Amazon/Amazon.yaml',
    'Facebook': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Facebook/Facebook.yaml',
    'Sony': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Sony/Sony.yaml',
    'Nintendo': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Nintendo/Nintendo.yaml',
    'SteamCN': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/SteamCN/SteamCN.yaml',
    'Steam': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Steam/Steam.yaml',
    'Wise': 'https://raw.githubusercontent.com/Accademia/Additional_Rule_For_Clash/main/VirtualFinance/Wise.yaml',
    'Game': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Game/Game.yaml',
    'Microsoft': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Microsoft/Microsoft.yaml',
    'TikTok': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/TikTok/TikTok.yaml',
    'Global': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Global/Global_Classical.yaml',
    'Apple': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Apple/Apple_Classical.yaml',
    'BiliBili': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/BiliBili/BiliBili.yaml',
    'BiliBiliIntl': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/BiliBiliIntl/BiliBiliIntl.yaml',
    'NetEaseMusic': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/NetEaseMusic/NetEaseMusic.yaml',
    'Baidu': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Baidu/Baidu.yaml',
    'DouBan': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/DouBan/DouBan.yaml',
    'DouYin': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/DouYin/DouYin.yaml',
    'WeChat': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/WeChat/WeChat.yaml',
    'OKX': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OKX/OKX.yaml',
    'Binance': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Binance/Binance.yaml',
    'ChinaMax': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/ChinaMax/ChinaMax_Classical.yaml',
  };

  for (let name in remoteRules) {
    config['rule-providers'][name] = {
      type: 'http', behavior: 'classical', url: remoteRules[name], interval: 86400
    };
  }

  // === 7. 规则路由 ===
  config['rules'] = [
    // Apple直连
    'DOMAIN-SUFFIX,icloud.com,DIRECT',
    'DOMAIN-SUFFIX,icloud.com.cn,DIRECT',
    'DOMAIN-SUFFIX,icloud-content.com,DIRECT',
    'DOMAIN-SUFFIX,apple.com.cn,DIRECT',
    'DOMAIN-SUFFIX,me.com,DIRECT',
    'RULE-SET,Apple,DIRECT',

    // 国内直连
    'RULE-SET,BiliBili,DIRECT',
    'RULE-SET,BiliBiliIntl,DIRECT',
    'RULE-SET,NetEaseMusic,DIRECT',
    'RULE-SET,Baidu,DIRECT',
    'RULE-SET,DouBan,DIRECT',
    'RULE-SET,DouYin,DIRECT',
    'RULE-SET,WeChat,DIRECT',
    'RULE-SET,ChinaMax,DIRECT',

    // 应用路由
    'RULE-SET,Claude,🤖 Claude',
    'RULE-SET,OpenAI,🤖 OpenAI',
    'RULE-SET,Gemini,🤖 Gemini',
    'RULE-SET,Twitter,❎ Twitter',
    'RULE-SET,Google,🕊️ Google',
    'RULE-SET,YouTube,🎬 YouTube',
    'RULE-SET,Telegram,📲 Telegram',
    'RULE-SET,Instagram,📷 Instagram',
    'RULE-SET,TikTok,🎵 TikTok',

    // 海外应用直连
    'RULE-SET,OKX,DIRECT',
    'RULE-SET,Binance,DIRECT',
    'DOMAIN-SUFFIX,bybit.com,DIRECT',
    'DOMAIN-SUFFIX,bytick.com,DIRECT',
    'DOMAIN-SUFFIX,bybitglobal.com,DIRECT',
    'RULE-SET,Wise,DIRECT',
    
    // 通用路由
    'DOMAIN-SUFFIX,litix.io,🌐 国际通用',
    'DOMAIN-SUFFIX,discomax.com,🌐 国际通用',
    'DOMAIN-SUFFIX,brightline.tv,🌐 国际通用',
    'RULE-SET,GitHub,🌐 国际通用',
    'RULE-SET,Spotify,🌐 国际通用',
    'RULE-SET,Netflix,🌐 国际通用',
    'RULE-SET,Disney,🌐 国际通用',
    'RULE-SET,PayPal,🌐 国际通用',
    'RULE-SET,Amazon,🌐 国际通用',
    'RULE-SET,Facebook,🌐 国际通用',
    'RULE-SET,Sony,🌐 国际通用',
    'RULE-SET,Nintendo,🌐 国际通用',
    'RULE-SET,SteamCN,🌐 国际通用',
    'RULE-SET,Steam,🌐 国际通用',
    'RULE-SET,Game,🌐 国际通用',
    'RULE-SET,Microsoft,🌐 国际通用',
    'RULE-SET,Global,🌐 国际通用',

    // 兜底规则
    'GEOIP,LAN,DIRECT',
    'GEOIP,CN,DIRECT',
    'MATCH,🌐 国际通用'
  ];

  return config;
}
