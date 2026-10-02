// Contract-shaped test data only. Never imported by the application.
export const row = {
 id:'test-expiring-1',domain:'seo123.co.uk',tld:'co.uk',sourceType:'expiring',
 provider:{key:'nominet',name:'Nominet',listingUrl:'https://example.org/listing?ref=eed'},
 price:null,priceCurrency:'USD',expires:'2026-10-04T10:00:00Z',qualityScore:54,age:8,
 metrics:{majestic:{tf:22,cf:28,backlinks:123,refDomains:40,ratio:0.78,edu:0,gov:0,ips:35,subnets:30,topics:[],language:'en'},moz:{links:100,da:30,pa:22,rank:2,spam:0,trust:1},domDetailer:{linksIn:100,pages:5,dofollow:80,edu:0,gov:0},semrush:{traffic:0,rank:0,links:0,keywords:0,price:'$0'},wayback:{snapshots:4,firstSnapshotAt:null,lastSnapshotAt:null}},
 auction:{type:'',bidCount:0,traffic:0,valuation:0,revenue:0,currency:'USD',revenuePeriod:'month'}
};
export const response = {ok:true,requestId:'fixture-request',page:1,pageSize:100,count:1,hasMore:true,nextPage:2,truncated:false,pagination:{page:1,pageSize:100,count:1,hasMore:true,nextPage:2,truncated:false,resultWindowMax:10000,exactTotal:false,total:null},backend:'manticore',index:{backend:'manticore',lastSyncAt:null,syncInProgress:false},source:'expiring',sort:{key:'majTF',dir:'desc'},credits:{charged:1,dailySearches:1,dailySearchLimit:1000,dailySearchRemaining:999,dailyResetTime:'2026-10-03T00:00:00Z'},results:[row]};
