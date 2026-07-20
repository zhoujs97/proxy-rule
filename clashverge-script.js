
// clash verge rev 上使用的全局配置脚本
// 在clash上使用合并多机场节点时使用

function main(config) {
  // === 1. 提取节点（兼容单机场与合并机场） ===
  const allProxyNames = config['proxies'] ? config['proxies'].map(p => p.name) : [];
  const filterStaticNodes = (reg) => allProxyNames.filter(name => reg.test(name));

  let hkStatic = filterStaticNodes(/香港|Hong Kong|HK|兔兔云/i).concat(['DIRECT']);
  let sgStatic = filterStaticNodes(/新加坡|Singapore|SG/i).concat(['DIRECT']);
  let usStatic = filterStaticNodes(/美国|USA|US/i).concat(['DIRECT']);
  let jpStatic = filterStaticNodes(/日本|Japan|JP/i).concat(['DIRECT']);

  const providers = config['proxy-providers'] ? Object.keys(config['proxy-providers']) : [];

  // === 2. 基础地区策略组 (第一层) ===
  // 这里只负责把相同地区的节点聚在一起
  const regionGroups = [
    { name: '🇭🇰 香港节点组', type: 'select', proxies: hkStatic, use: providers, filter: '(?i)香港|Hong Kong|HK|兔兔云' },
    { name: '🇸🇬 新加坡节点组', type: 'select', proxies: sgStatic, use: providers, filter: '(?i)新加坡|Singapore|SG' },
    { name: '🇺🇸 美国节点组', type: 'select', proxies: usStatic, use: providers, filter: '(?i)美国|USA|US' },
    { name: '🇯🇵 日本节点组', type: 'select', proxies: jpStatic, use: providers, filter: '(?i)日本|Japan|JP' }
  ];

  // === 3. 场景应用策略组 (第二层 - 嵌套层) ===
  // 这里的代理选项不再是具体节点，而是上面的“地区节点组”
  const appGroups = [
    {
      name: '🤖 OpenAI',
      type: 'select',
      proxies: ['🇸🇬 新加坡节点组', '🇯🇵 日本节点组', '🇺🇸 美国节点组']
    },
    {
      name: '🤖 Claude',
      type: 'select',
      proxies: ['🇺🇸 美国节点组', '🇸🇬 新加坡节点组', '🇯🇵 日本节点组']
    },
    {
      name: '🤖 Gemini',
      type: 'select',
      proxies: ['🇺🇸 美国节点组', '🇸🇬 新加坡节点组', '🇯🇵 日本节点组']
    },
    {
      name: '🤖 Twitter',
      type: 'select',
      proxies: ['🇯🇵 日本节点组', '🇺🇸 美国节点组', '🇸🇬 新加坡节点组',]
    },
    {
      name: '🤖 Google',
      type: 'select',
      proxies: ['🇺🇸 美国节点组', '🇯🇵 日本节点组', '🇸🇬 新加坡节点组',]
    },
    {
      name: '🎬 YouTube',
      type: 'select',
      proxies: ['🇭🇰 香港节点组', '🇸🇬 新加坡节点组', '🇯🇵 日本节点组', '🇺🇸 美国节点组']
    },
    {
      name: '📷 Instagram',
      type: 'select',
      proxies: ['🇭🇰 香港节点组', '🇸🇬 新加坡节点组', '🇯🇵 日本节点组', '🇺🇸 美国节点组']
    },
    {
      name: '📲 Telegram',
      type: 'select',
      proxies: ['🇸🇬 新加坡节点组', '🇭🇰 香港节点组', '🇯🇵 日本节点组', '🇺🇸 美国节点组']
    },
    {
      name: '🌐 国际通用',
      type: 'select',
      'include-all': true
    }
  ];

  // 将两层策略组拼接到配置文件中
  config['proxy-groups'] = appGroups.concat(regionGroups).concat(config['proxy-groups'] || []);

  // === 4. 插入监听端口 (依然指向地区组，保持底层分流稳定) ===
  const myListeners = [
    { name: 'proxy-hk', type: 'socks', port: 7898, proxy: '🇭🇰 香港节点组' },
    { name: 'proxy-sg', type: 'socks', port: 7899, proxy: '🇸🇬 新加坡节点组' },
    { name: 'proxy-usa', type: 'socks', port: 7900, proxy: '🇺🇸 美国节点组' },
    { name: 'proxy-jp', type: 'socks', port: 7901, proxy: '🇯🇵 日本节点组' }
  ];
  
  // 获取已有的 listeners
  let currentListeners = config['listeners'] || [];
  
  // 提取我们要添加的 listener 的名称
  const myListenerNames = myListeners.map(l => l.name);
  
  // 过滤掉原本配置中已经存在同名的 listener，防止 duplicate name 报错
  currentListeners = currentListeners.filter(l => !myListenerNames.includes(l.name));
  
  // 将过滤后的列表与自定义的列表合并
  config['listeners'] = currentListeners.concat(myListeners);

  // === 5. 引入外部规则集 (Rule Providers) ===
  if (!config['rule-providers']) config['rule-providers'] = {};

  const remoteRules = {
    // AI 列表 //
    'OpenAI': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OpenAI/OpenAI.yaml',
    'Claude': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Claude/Claude.yaml',
    'Gemini': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Gemini/Gemini.yaml',
    'Twitter': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Twitter/Twitter.yaml',
    'Google': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Google/Google.yaml',
    // 常用海外列表 //
    'GitHub': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/GitHub/GitHub.yaml',
    'Telegram': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Telegram/Telegram.yaml',
    'YouTube': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/YouTube/YouTube.yaml',
    'Instagram': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Instagram/Instagram.yaml',
    // 其他海外列表 //
    'Spotify': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Spotify/Spotify.yaml',
    'Netflix': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Netflix/Netflix.yaml',
    'Disney': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Disney/Disney.yaml',
    'PayPal': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/PayPal/PayPal.yaml',
    'Amazon': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Amazon/Amazon.yaml',
    'Facebook': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Facebook/Facebook.yaml',
    'Sony': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Sony/Sony.yaml',
    'Nintendo': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Nintendo/Nintendo.yaml',
    'SteamCN': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/SteamCN/SteamCN.yaml',
    'Steam': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Steam/Steam.yaml',
    'Game': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Game/Game.yaml',
    'Microsoft': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Microsoft/Microsoft.yaml',
    'TikTok': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/TikTok/TikTok.yaml',
    'Global': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Global/Global.yaml',
    // 直连列表 //
    'Apple': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Apple/Apple.yaml',
    'BiliBili': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/BiliBili/BiliBili.yaml',
    'BiliBiliIntl': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/BiliBiliIntl/BiliBiliIntl.yaml',
    'NetEaseMusic': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/NetEaseMusic/NetEaseMusic.yaml',
    'Baidu': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Baidu/Baidu.yaml',
    'DouBan': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/DouBan/DouBan.yaml',
    'DouYin': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/DouYin/DouYin.yaml',
    'WeChat': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/WeChat/WeChat.yaml',
    'ChinaMax': 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/ChinaMax/ChinaMax.yaml',
  };

  for (let name in remoteRules) {
    config['rule-providers'][name] = {
      type: 'http', behavior: 'classical', url: remoteRules[name], interval: 86400
    };
  }

  // === 6. 将规则指向“应用策略组” ===
  let customRules = [
    // --- 国内服务直连 ---
    'RULE-SET,Apple,DIRECT',
    'RULE-SET,BiliBili,DIRECT',
    'RULE-SET,BiliBiliIntl,DIRECT',
    'RULE-SET,NetEaseMusic,DIRECT',
    'RULE-SET,Baidu,DIRECT',
    'RULE-SET,DouBan,DIRECT',
    'RULE-SET,DouYin,DIRECT',
    'RULE-SET,WeChat,DIRECT',
    'RULE-SET,ChinaMax,DIRECT',

    // --- 应用分组路由 ---
    'RULE-SET,Claude,🤖 Claude',
    'RULE-SET,OpenAI,🤖 OpenAI',
    'RULE-SET,Gemini,🤖 Gemini',
    'RULE-SET,Twitter,🤖 Twitter',
    'RULE-SET,Google,🤖 Google',
    'RULE-SET,YouTube,🎬 YouTube',
    'RULE-SET,Telegram,📲 Telegram',
    'RULE-SET,Instagram,📷 Instagram',

    // --- 通用路由 ---
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
    'RULE-SET,TikTok,🌐 国际通用',
    'RULE-SET,Global,🌐 国际通用',

    // --- 兜底规则 ---
    'GEOIP,LAN,DIRECT',
    'GEOIP,CN,DIRECT',
    'MATCH,🌐 国际通用'
  ];

  config['rules'] = customRules;
  return config;
}
