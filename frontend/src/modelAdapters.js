const D={tire:/tire|tyre|rubber/i,glass:/glass|window|windscreen|windshield/i,caliper:/caliper|brake(?![ _-]?light)/i,
rim:/(^|[^a-z])rim|alloy|spoke|hub_?cap|wheel(?![ _-]?(well|arch))/i,interior:/leather|seat|interior|dashboard|alcantara|upholster|cabin|carpet|fabric|seatbelt/i,carbon:/carbon(?:[_ -]?fiber)?/i,body:/car_?paint|paint|exterior|coachwork/i,suzukiPaint:/pearl[_ -]?ablaze[_ -]?red/i};
export const PARTS=['body','rim','caliper','glass','interior','carbon','badge'];
export function classify({mesh='',mat='',chain=[]},adapter={}){
const meshName=String(mesh),materialName=String(mat),own=`${meshName} ${materialName}`,near=`${own} ${chain.slice(0,2).join(' ')}`;
if((adapter.ignore||[]).some(r=>r.test(near)))return null;
for(const c of PARTS)if((adapter[c]||[]).some(r=>r.test(near)))return c;
if(D.tire.test(materialName)||D.tire.test(meshName))return null;
if(D.glass.test(materialName)||D.glass.test(meshName))return'glass';
if(D.caliper.test(materialName)||D.caliper.test(meshName))return'caliper';
if(D.rim.test(materialName)||D.rim.test(meshName))return'rim';
if(D.interior.test(materialName)||D.interior.test(meshName))return'interior';
if(D.carbon.test(materialName))return'carbon';
if(D.body.test(materialName)||D.suzukiPaint.test(meshName))return'body';
return null}
