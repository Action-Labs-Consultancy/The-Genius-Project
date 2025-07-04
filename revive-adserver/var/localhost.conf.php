;<?php exit; ?>
;*** DO NOT REMOVE THE LINE ABOVE ***

[openads]
installed=1
requireSSL=
sslPort=443

[ui]
enabled=1
applicationName=
headerFilePath=
footerFilePath=
logoFilePath=
headerForegroundColor=
headerBackgroundColor=
headerActiveTabColor=
headerTextColor=
gzipCompression=1
supportLink=
combineAssets=1
dashboardEnabled=1
hideNavigator=
zoneLinkingStatistics=1
disableDirectSelection=1

[database]
type=mysqli
host=localhost
socket=
port=3306
username=root
password=
name=revive
persistent=
protocol=tcp
compress=
ssl=
capath=
ca=

[databaseCharset]
checkComplete=1
clientCharset=

[databaseMysql]
statisticsSortBufferSize=

[databasePgsql]
schema=

[webpath]
admin="localhost:8080/www/admin"
delivery="localhost:8080/www/delivery"
deliverySSL="localhost:8080/www/delivery"
images="localhost:8080/www/images"
imagesSSL="localhost:8080/www/images"

[file]
asyncjs="asyncjs.php"
asyncjsjs="async.js"
asyncspc="asyncspc.php"
click="ck.php"
signedClick="cl.php"
conversionvars="tv.php"
content="ac.php"
conversion="ti.php"
conversionjs="tjs.php"
frame="afr.php"
image="ai.php"
js="ajs.php"
layer="al.php"
log="lg.php"
popup="apu.php"
view="avw.php"
xmlrpc="axmlrpc.php"
local="alocal.php"
frontcontroller="fc.php"
singlepagecall="spc.php"
spcjs="spcjs.php"
xmlrest="ax.php"

[store]
mode=0
webDir="/Users/rabab/the-genius-project/revive-adserver/www/images"
ftpHost=
ftpPath=
ftpUsername=
ftpPassword=
ftpPassive=

[allowedBanners]
sql=1
web=1
url=1
html=1
text=1
video=1

[delivery]
cacheExpire=1200
cacheStorePlugin="deliveryCacheStore:oxCacheFile:oxCacheFile"
cachePath=
acls=1
aclsDirectSelection=1
obfuscate=
ctDelimiter=__
chDelimiter=","
keywords=
cgiForceStatusHeader=
clicktracking=
ecpmSelectionRate="0.9"
enableControlOnPureCPM=1
assetClientCacheExpire=3600
secret="473pm/HvYDE09jE+6SDvFUAVXWb+ApxVKvYaGE+8wVY="
clickUrlValidity=0
relAttribute="noopener nofollow"

[defaultBanner]
invalidZoneHtmlBanner=
suspendedAccountHtmlBanner=
inactiveAccountHtmlBanner=

[p3p]
policies=1
compactPolicy="CUR ADM OUR NOR STA NID"
policyLocation=

[privacy]
disableViewerId=1
anonymiseIp=1

[graphs]
ttfDirectory=
ttfName=

[logging]
adRequests=
adImpressions=1
adClicks=1
trackerImpressions=1
reverseLookup=
proxyLookup=1
defaultImpressionConnectionWindow=
defaultClickConnectionWindow=
ignoreHosts=
ignoreUserAgents=
enforceUserAgents=
blockAdClicksWindow=0
blockInactiveBanners=1

[maintenance]
autoMaintenance=1
timeLimitScripts=1800
operationInterval=60
blockAdImpressions=0
blockAdClicks=0
channelForecasting=
pruneCompletedCampaignsSummaryData=
pruneDataTables=1
ecpmCampaignLevels="9|8|7|6"

[priority]
instantUpdate=1
intentionalOverdelivery=0
defaultClickRatio="0.005"
defaultConversionRatio="0.0001"
randmax=2147483647

[performanceStatistics]
defaultImpressionsThreshold=10000
defaultDaysIntervalThreshold=30

[table]
prefix=rv_
type=MYISAM
account_preference_assoc=account_preference_assoc
account_user_assoc=account_user_assoc
account_user_permission_assoc=account_user_permission_assoc
accounts=accounts
acls=acls
acls_channel=acls_channel
ad_category_assoc=ad_category_assoc
ad_zone_assoc=ad_zone_assoc
affiliates=affiliates
affiliates_extra=affiliates_extra
agency=agency
application_variable=application_variable
audit=audit
banners=banners
campaigns=campaigns
campaigns_trackers=campaigns_trackers
category=category
channel=channel
clients=clients
data_intermediate_ad=data_intermediate_ad
data_intermediate_ad_connection=data_intermediate_ad_connection
data_intermediate_ad_variable_value=data_intermediate_ad_variable_value
data_raw_ad_click=data_raw_ad_click
data_raw_ad_impression=data_raw_ad_impression
data_raw_ad_request=data_raw_ad_request
data_raw_tracker_impression=data_raw_tracker_impression
data_raw_tracker_variable_value=data_raw_tracker_variable_value
data_summary_ad_hourly=data_summary_ad_hourly
data_summary_ad_zone_assoc=data_summary_ad_zone_assoc
data_summary_channel_daily=data_summary_channel_daily
data_summary_zone_impression_history=data_summary_zone_impression_history
images=images
log_maintenance_forecasting=log_maintenance_forecasting
log_maintenance_priority=log_maintenance_priority
log_maintenance_statistics=log_maintenance_statistics
password_recovery=password_recovery
placement_zone_assoc=placement_zone_assoc
preferences=preferences
session=session
targetstats=targetstats
trackers=trackers
tracker_append=tracker_append
userlog=userlog
users=users
variables=variables
variable_publisher=variable_publisher
zones=zones

[email]
logOutgoing=1
headers=
qmailPatch=
fromName=
fromAddress="r.hasan@action-labs.co"
fromCompany=
useManagerDetails=

[log]
enabled=1
methodNames=
lineNumbers=
type=file
name="debug.log"
priority=6
ident=OX
paramsUsername=
paramsPassword=
fileMode=0644

[deliveryLog]
enabled=
name="delivery.log"
fileMode=0644
priority=6

[cookie]
permCookieSeconds=31536000
maxCookieSize=2048
domain=
viewerIdDomain=

[debug]
logfile=
production=1
sendErrorEmails=
emailSubject="Error from Revive Adserver"
email="email@example.com"
emailAdminThreshold=3
errorOverride=1
showBacktrace=
disableSendEmails=

[var]
prefix=OA_
cookieTest=ct
cacheBuster=cb
channel=source
dest=dest
signature=sig
timestamp=ts
logClick=log
n=n
params=oaparams
viewerId=OAID
viewerGeo=OAGEO
campaignId=campaignid
adId=bannerid
creativeId=cid
zoneId=zoneid
blockAd=OABLOCK
capAd=OACAP
sessionCapAd=OASCAP
blockCampaign=OACBLOCK
capCampaign=OACCAP
sessionCapCampaign=OASCCAP
blockZone=OAZBLOCK
capZone=OAZCAP
sessionCapZone=OASZCAP
vars=OAVARS
trackonly=trackonly
openads=openads
lastView=OXLIA
lastClick=OXLCA
blockLoggingClick=OXBLC
fallBack=oxfb
trace=OXTR
product=revive

[lb]
enabled=
type=mysql
host=localhost
port=3306
username=
password=
name=
persistent=

[sync]
checkForUpdates=1
shareStack=1

[oacSync]
protocol=https
host="sync.revive-adserver.com"
path="/xmlrpc.php"
httpPort=80
httpsPort=443

[authentication]
type=internal
deleteUnverifiedUsersAfter=2419200

[geotargeting]
type=
showUnavailable=

[pluginPaths]
packages="/plugins/etc/"
plugins="/plugins/"
admin="/www/admin/plugins/"
var="/var/plugins/"

[pluginSettings]
enableOnInstall=1
useMergedFunctions=1

[plugins]
openXBannerTypes=1
openXDeliveryLimitations=1
openXReports=1
openXDeliveryCacheStore=1
openXInvocationTags=1
openXDeliveryLog=1
openXVideoAds=1
reviveMaxMindGeoIP2=1
apVideo=1

[pluginGroupComponents]
oxHtml=1
oxText=1
Client=1
Geo=1
Site=1
Time=1
oxReportsStandard=1
oxReportsAdmin=1
oxCacheFile=1
oxMemcached=1
oxInvocationTags=1
oxDeliveryDataPrepare=1
oxLogClick=1
oxLogConversion=1
oxLogImpression=1
oxLogRequest=1
vastInlineBannerTypeHtml=1
vastOverlayBannerTypeHtml=1
oxLogVast=1
vastServeVideoPlayer=1
videoReport=1
rvMaxMindGeoIP2=1
rvMaxMindGeoIP2Maintenance=1
apVideo=1
apVideoUI=1

[audit]
enabled=1
enabledForZoneLinking=

[security]
passwordMinLength=12

[Client]
sniff=1

[deliveryHooks]
postInit="deliveryLimitations:Client:initClientData"
cacheStore="deliveryCacheStore:oxCacheFile:oxCacheFile|deliveryCacheStore:oxMemcached:oxMemcached"
cacheRetrieve="deliveryCacheStore:oxCacheFile:oxCacheFile|deliveryCacheStore:oxMemcached:oxMemcached"
preLog="deliveryDataPrepare:oxDeliveryDataPrepare:dataCommon|deliveryDataPrepare:oxDeliveryDataPrepare:dataPageInfo|deliveryDataPrepare:oxDeliveryDataPrepare:dataUserAgent"
logClick="deliveryDataPrepare:oxDeliveryDataPrepare:dataCommon|deliveryLog:oxLogClick:logClick"
logConversion="deliveryLog:oxLogConversion:logConversion"
logConversionVariable="deliveryLog:oxLogConversion:logConversionVariable"
logImpression="deliveryDataPrepare:oxDeliveryDataPrepare:dataCommon|deliveryLog:oxLogImpression:logImpression"
logRequest="deliveryDataPrepare:oxDeliveryDataPrepare:dataCommon|deliveryLog:oxLogRequest:logRequest"
logImpressionVast="deliveryLog:oxLogVast:logImpressionVast"

[oxCacheFile]
cachePath=

[oxMemcached]
memcachedServers=
memcachedExpireTime=

[oxInvocationTags]
isAllowedAsync=1
isAllowedAdjs=1
isAllowedAdframe=1
isAllowedAdlayer=1
isAllowedAdview=0
isAllowedAdviewnocookies=1
isAllowedPopup=0

[vastOverlayBannerTypeHtml]
isVastOverlayAsTextEnabled=1
isVastOverlayAsImageEnabled=1
isVastOverlayAsHtmlEnabled=1

[vastServeVideoPlayer]
isAutoPlayOfVideoInOpenXAdminToolEnabled=0

[rvMaxMindGeoIP2]
mmdb_paths=
account_id=
license_key=
