const image = (name, gender, index) => {
  const palettes = {
    Erkek: ['#182b35', '#385f65', '#d2a869'],
    Kadın: ['#3c2635', '#9a5872', '#f0bd9b'],
    Unisex: ['#26202e', '#65507d', '#d9b77a']
  }
  const [dark, mid, glow] = palettes[gender]
  const safe = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="0.52" stop-color="${mid}"/><stop offset="1" stop-color="${glow}"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".4"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".12"/><stop offset="1" stop-color="#07080b" stop-opacity=".32"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="70"/></filter></defs><rect width="800" height="1000" fill="url(#bg)"/><circle cx="640" cy="180" r="180" fill="${glow}" opacity=".28" filter="url(#blur)"/><circle cx="140" cy="800" r="220" fill="#fff" opacity=".08" filter="url(#blur)"/><path d="M0 810 Q220 690 420 830 T800 760 V1000 H0Z" fill="#0b1316" opacity=".18"/><g transform="translate(194 150)"><rect x="132" y="0" width="148" height="110" rx="20" fill="#1c2328" opacity=".88"/><rect x="162" y="-32" width="88" height="55" rx="13" fill="#d6b377"/><rect x="84" y="82" width="244" height="530" rx="44" fill="url(#glass)" stroke="#fff" stroke-opacity=".32" stroke-width="5"/><path d="M104 180 Q206 218 308 180 V563 Q206 610 104 563Z" fill="#061019" opacity=".24"/><rect x="108" y="332" width="196" height="136" rx="9" fill="#f0d7a8" opacity=".94"/><text x="206" y="376" text-anchor="middle" fill="#172025" font-family="Georgia,serif" font-size="24" letter-spacing="3">ARVEN</text><text x="206" y="412" text-anchor="middle" fill="#172025" font-family="Arial,sans-serif" font-size="12" letter-spacing="2">${safe.slice(0, 22)}</text><path d="M116 500 H296" stroke="#fff" stroke-opacity=".34"/></g><text x="52" y="915" fill="#fff" opacity=".84" font-family="Arial,sans-serif" font-size="14" letter-spacing="4">ARVEN / ${gender.toUpperCase()}</text><text x="52" y="948" fill="#fff" opacity=".62" font-family="Georgia,serif" font-size="25">${safe.slice(0, 28)}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

// USD prices supplied by the catalogue owner. Keep names aligned with the products below.
const pricesUsd = {
  'Armani Stronger With You Intense': 17,
  'Burberry Hero': 17,
  'Byredo Vanille Antique': 18,
  'Bad Boy Gold Fantasy': 17,
  'Chanel Allure Homme Sport': 16,
  'Creed Aventus': 21,
  'Creed Aventus Absolu': 25,
  'D&G The One For Men': 16,
  'Dior Sauvage': 17,
  'Gucci Guilty Elixir': 18,
  'Hugo Boss Absolu': 19,
  'Hugo Boss Bottled Elixir': 17,
  'Lacoste Red': 16,
  'Le Male Elixir': 17,
  'Megamare': 50,
  'Ombre Leather': 23,
  'One Million Elixir': 17,
  'Invictus Aqua': 17,
  'Reflection Man': 17,
  'Versace Dylan Blue': 16,
  'Versace Oud Noir': 16,
  'Amarys Femme': 17,
  'Burberry Goodness': 17,
  'Burberry Her': 17,
  'Chanel Chance': 17,
  'Chloe Nomade': 17,
  'Coco Mademoiselle': 17,
  'Creed For Her': 19,
  "Dior J'adore": 17,
  'Gucci Flora Magnolia': 18,
  'Guidance 46': 28,
  'Hypnotic Poison': 17,
  'Narciso For Her': 17,
  'Shiseido Zen': 17,
  'Valaya': 30,
  'Voce Viva Intense': 17,
  'YSL Libre': 17,
  'Nomade': 17,
  'Baccarat Rouge 540': 26,
  'Black Afgano': 20,
  'Blue Talisman': 18,
  'Carios': 21,
  'Devils Intrigue': 20,
  'Dior Gris': 22,
  'Oud Ispahan': 19,
  'Narcotic': 17,
  'Hibiscus Mahajad': 21,
  'Imagination': 33,
  'Musk Therapy': 25,
  'Oud For Greatness': 21,
  'Wild Rush': 23,
  'Khamrah': 17,
  'Layton': 25,
  'Ganymede': 23,
  'Marfa Memo': 17,
  'Molecule 02': 40,
  'Arabian Tonka': 18,
  'Oud Maracuja': 32,
  'Oud Save The King': 18,
  'Part Of Lady': 25,
  'Kirke': 21,
  'Bitter Peach': 18,
  'Black Orchid': 16,
  'Vanilla Sex': 16,
  'Torino 21': 17,
  'Vanilla Powder': 16,
  'Erba Pura': 20,
  'Naxos': 17,
  'Ombre Nomade': 17,
  'Huram Blanc': 24
}

const make = (name, gender, family, notes, description, rating, longevity, sillage, index) => ({
  id: `${gender}-${name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
  name, gender, family, notes, description, rating, longevity, sillage,
  priceUsd: pricesUsd[name], image: image(name, gender, index)
})

const men = [
  ['Armani Stronger With You Intense','Amber Woody',['kestane','vanilya','amber'],'Kestanenin sıcak gourmand dokusu, vanilya ve amberle sarılır. Soğuk havada yakın ve davetkâr bir iz bırakır.',4.7,'8–10 saat','Güçlü'],
  ['Burberry Hero','Woody Aromatic',['sedir','çam','benzoin'],'Üç farklı sedir ağacının ferah çam ve reçineli benzoinle buluştuğu temiz, modern bir odunsu.',4.5,'6–8 saat','Orta'],
  ['Byredo Vanille Antique','Amber Vanilla',['koyu vanilya','erik','amber'],'Kuru erik ve isli vanilya, kadifemsi amberin içinde ağır ağır erir. Geceye yakışan koyu bir imza.',4.6,'8–10 saat','Orta'],
  ['Bad Boy Gold Fantasy','Amber Spicy',['kakao','amber','sedir'],'Kakao ve amberin tatlı tarafı, kuru sedirle dengelenir. Akşam kullanımı için sıcak ve kendinden emin.',4.4,'7–9 saat','Güçlü'],
  ['Chanel Allure Homme Sport','Citrus Woody',['narenciye','aldehit','tonka'],'Canlı narenciyeyi temiz aldehitler ve yumuşak tonka taşır. Her mevsime uyum sağlayan sportif klasik.',4.7,'6–8 saat','Orta'],
  ['Creed Aventus','Fruity Woody',['ananas','bergamot','huş','misk'],'Sulu ananas ve bergamot, dumansı huş ağacıyla keskinleşir. Karizmatik ve kolay fark edilen bir meyveli odunsu.',4.8,'8–10 saat','Güçlü'],
  ['Creed Aventus Absolu','Woody Amber',['karabiber','bergamot','paçuli','amber'],'Aventus DNA’sını daha koyu karabiber, paçuli ve amberle yoğunlaştırır; daha derin ve gece odaklı.',4.7,'9–11 saat','Güçlü'],
  ["D&G The One For Men",'Amber Spicy',['greyfurt','zencefil','tütün'],'Greyfurtun parlak açılışı tütün ve zencefilin sıcaklığına dönüşür. Yakın mesafede etkili, zarif bir akşam kokusu.',4.5,'5–7 saat','Orta'],
  ['Dior Sauvage','Aromatic Fougere',['bergamot','ambroxan','biber'],'Keskin bergamot, mineral ambroxan ve biberle ferah, güçlü ve kolay tanınan bir iz bırakır.',4.6,'8–10 saat','Güçlü'],
  ['Gucci Guilty Elixir','Amber Fougere',['lavanta','iris','vanilya'],'Lavanta ve pudramsı iris, kremsi vanilyayla yoğunlaşır. Modern, bakımlı ve amberli bir aura.',4.4,'8–10 saat','Güçlü'],
  ['Hugo Boss Absolu','Woody Leather',['deri','paçuli','amber'],'Derinin kuru dokusu paçuli ve sıcak amberle yuvarlanır; koyu, şehirli ve kararlı.',4.4,'7–9 saat','Orta'],
  ['Hugo Boss Bottled Elixir','Woody Incense',['tütsü','sedir','olibanum'],'Tütsü ve olibanumun dumanı, sedir ağacının kuru gövdesiyle birleşir. Şık ve derin.',4.5,'8–10 saat','Güçlü'],
  ['Lacoste Red','Green Woody',['elma','çam','reçine'],'Çıtır elma ve yeşil çam, reçineli bir tabanla sportif ve enerjik bir çizgiye dönüşür.',4.2,'4–6 saat','Orta'],
  ['Le Male Elixir','Amber Vanilla',['lavanta','bal','tonka','vanilya'],'Bal ve vanilyanın yoğun tatlılığı, lavanta ve tonka ile dengelenir. Sıcak, dikkat çekici ve geceye uygun.',4.7,'9–12 saat','Çok güçlü'],
  ['Megamare','Marine Woody',['deniz yosunu','tuz','ambergris'],'Tuzlu deniz havası ve yosunsu mineralite, ambergris ile ham ve güçlü bir okyanus etkisi yaratır.',4.3,'10+ saat','Çok güçlü'],
  ['Ombre Leather','Leather Floral',['deri','ahududu','yasemin'],'Kadifemsi deri, ahududu ve yaseminin yumuşak çiçek dokusuyla aydınlanır. Modern bir deri klasiği.',4.8,'9–11 saat','Güçlü'],
  ['One Million Elixir','Amber Woody',['elma','davana','tonka','vanilya'],'Elmanın meyveli parlaklığı davana, tonka ve vanilyanın şekerli amberine yaslanır.',4.5,'8–10 saat','Güçlü'],
  ['Invictus Aqua','Aromatic Aquatic',['deniz notası','greyfurt','menekşe yaprağı'],'Greyfurt ve deniz notaları, yeşil menekşe yaprağıyla serin ve sportif bir açılış sunar.',4.3,'5–7 saat','Orta'],
  ['Reflection Man','Woody Floral',['neroli','yasemin','sandal'],'Neroli ve yasemin, kremsi sandal ağacına yaslanır. Temiz gömlek hissi veren rafine beyaz çiçekli odunsu.',4.6,'6–8 saat','Orta'],
  ['Versace Dylan Blue','Aromatic Fougere',['greyfurt','ambroxan','tütsü'],'Greyfurt, ambroxan ve tütsüyle duş sonrası ferahlığını koyu ve maskülen bir tabanla birleştirir.',4.5,'6–8 saat','Orta'],
  ['Versace Oud Noir','Woody Oriental',['oud','deri','baharat'],'Oud ve derinin koyu gövdesi, baharatlarla açılır. Reçinemsi, sofistike ve akşamlık.',4.4,'8–10 saat','Güçlü']
].map((x,i)=>make(x[0],'Erkek',x[1],x[2],x[3],x[4],x[5],x[6],i))

const women = [
  ['Amarys Femme','Floral Amber',['narenciye','çiçek','vanilya'],'Narenciyenin aydınlık açılışı, pudramsı çiçekler ve vanilyayla zarif bir tene dönüşür.',4.2,'5–7 saat','Orta'],
  ['Burberry Goodness','Gourmand Floral',['lavanta','vanilya','kakao'],'Lavanta ve kakaonun kremsi gourmand etkisi, yumuşak vanilyayla sarılır.',4.4,'7–9 saat','Orta'],
  ['Burberry Her','Fruity Floral',['çilek','ahududu','yasemin'],'Kırmızı meyvelerin neşesi, yaseminin şeffaf çiçekliliğiyle modern ve canlıdır.',4.6,'7–9 saat','Güçlü'],
  ['Chanel Chance','Chypre Floral',['limon','yasemin','paçuli'],'Limonun canlılığı yasemin ve paçulinin zarif şipre yapısına oturur; zamansız ve dengeli.',4.7,'6–8 saat','Orta'],
  ['Chloe Nomade','Woody Floral',['mirabelle','frezya','meşe yosunu'],'Mirabelle eriğinin meyveli açılışı, frezya ve meşe yosunuyla özgür ruhlu bir çizgiye taşınır.',4.5,'7–9 saat','Orta'],
  ['Coco Mademoiselle','Chypre Amber',['portakal','gül','paçuli'],'Portakalın ışıltısı, gül ve paçulinin sofistike şipre imzasıyla buluşur.',4.8,'8–10 saat','Güçlü'],
  ['Creed For Her','Fruity Floral',['şeftali','gül','amber'],'Kadifemsi şeftali ve gül, amberin sıcak ten hissiyle yumuşak ve feminen kalır.',4.4,'6–8 saat','Orta'],
  ["Dior J'adore",'Floral',['ylang-ylang','yasemin','gül'],'Ylang-ylang, yasemin ve gülün ışıltılı buketi; temiz, zarif ve kutlama hissi veren bir çiçeksi.',4.7,'7–9 saat','Güçlü'],
  ['Gucci Flora Magnolia','Floral Musk',['magnolya','yeşil notalar','misk'],'Taze yeşil notalar magnolyanın kremsi çiçekliliğini açar, miskle temizlenir.',4.3,'5–7 saat','Orta'],
  ['Guidance 46','Floral Amber',['armut','gül','ambergris'],'Sulu armut ve gül, ambergris ile yoğun ve dokulu bir çiçeksi amber yaratır.',4.6,'10+ saat','Çok güçlü'],
  ['Hypnotic Poison','Amber Vanilla',['badem','vanilya','yasemin'],'Bademin kremamsı dokusu vanilya ve yaseminle birleşerek ikonik, sıcak bir gourmand olur.',4.7,'8–10 saat','Güçlü'],
  ['Narciso For Her','Musk Floral',['misk','şeftali','gül'],'Temiz misk, şeftali ve gülün pudramsı ten hissini taşır; sakin ve bağımlılık yapan.',4.6,'6–8 saat','Orta'],
  ['Shiseido Zen','Fruity Chypre',['greyfurt','ananas','paçuli'],'Greyfurt ve ananasın meyveli ışıltısı paçulinin zarif derinliğiyle dengelenir.',4.2,'5–7 saat','Orta'],
  ['Valaya','Musk Floral',['şeftali','çiçek','misk'],'Havadar şeftali ve temiz çiçekler, tenle bütünleşen transparan bir miskle sona erer.',4.5,'6–8 saat','Orta'],
  ['Voce Viva Intense','Floral Amber',['mandalina','yasemin','vanilya'],'Mandalina ve yasemin, yoğun vanilya ile aydınlık ama sıcak bir beyaz çiçek imzasına dönüşür.',4.5,'7–9 saat','Güçlü'],
  ['YSL Libre','Aromatic Floral',['lavanta','portakal çiçeği','vanilya'],'Lavanta ve portakal çiçeği, vanilyanın sıcaklığıyla güçlü ve özgür bir floral yaratır.',4.7,'8–10 saat','Güçlü'],
  ['Nomade','Woody Floral',['erik','frezya','meşe yosunu'],'Erik ve frezya, kuru meşe yosunuyla birleşerek maceracı ve sofistike bir hava verir.',4.5,'7–9 saat','Orta']
].map((x,i)=>make(x[0],'Kadın',x[1],x[2],x[3],x[4],x[5],x[6],i+30))

const unisex = [
  ['Baccarat Rouge 540','Amber Woody',['safran','yasemin','amberwood'],'Safran ve yaseminin havadar çiçekliliği, kristalimsi amberwood ile imza niteliğinde bir iz bırakır.',4.8,'10+ saat','Çok güçlü'],
  ['Black Afgano','Woody Amber',['cannabis','oud','reçine'],'Koyu reçineler, oud ve aromatik yeşilliklerle dumanlı, yoğun ve gizemli.',4.4,'10+ saat','Çok güçlü'],
  ['Blue Talisman','Fruity Musk',['bergamot','armut','misk'],'Bergamot ve armutun parlak meyveliliği, temiz miskle şeffaf bir ten kokusuna dönüşür.',4.5,'6–8 saat','Orta'],
  ['Carios','Citrus Woody',['narenciye','odunsu notalar','misk'],'Narenciyenin ferah enerjisi, kuru odunsu notalar ve yumuşak miskle dengelenir.',4.1,'5–7 saat','Orta'],
  ['Devils Intrigue','Amber Spicy',['tütün','baharat','amber'],'Kuru tütün ve sıcak baharatlar, amberin karanlık tatlılığıyla akşam odaklı bir aura verir.',4.3,'7–9 saat','Güçlü'],
  ['Dior Gris','Chypre Floral',['gül','incir','odunsu notalar'],'Gül ve incirin yumuşak meyveliliği, kuru odunsu notalarla zarif bir şipreye bağlanır.',4.5,'6–8 saat','Orta'],
  ['Oud Ispahan','Woody Floral',['gül','oud','paçuli'],'Gülün kadifemsi yüzü, oud ve paçulinin zengin gövdesiyle koyu ve gösterişli.',4.7,'10+ saat','Çok güçlü'],
  ['Narcotic','Floral',['tuberose','yasemin','ylang-ylang'],'Tuberose, yasemin ve ylang-ylangın yoğun beyaz çiçek buketi; cesur ve baş döndürücü.',4.4,'8–10 saat','Güçlü'],
  ['Hibiscus Mahajad','Fruity Floral',['hibiskus','gül','deri'],'Hibiskus ve gülün meyveli ışıltısı, yumuşak deriyle dokulu ve canlı.',4.5,'8–10 saat','Güçlü'],
  ['Imagination','Citrus Aromatic',['neroli','çay','ambroxan'],'Neroli ve siyah çayın temizliği, mineral ambroxanla modern bir narenciye ferahlığı sunar.',4.6,'7–9 saat','Orta'],
  ['Musk Therapy','Musk Floral',['bergamot','siyah frenk üzümü','misk'],'Bergamot ve siyah frenk üzümü, kremsi miskin tenle bütünleşen rahatlığını taşır.',4.5,'6–8 saat','Orta'],
  ['Oud For Greatness','Woody Spicy',['safran','oud','lavanta'],'Safranın baharatı, güçlü oud ve aromatik lavantayla asil ve yoğun bir silaj yaratır.',4.7,'10+ saat','Çok güçlü'],
  ['Wild Rush','Citrus Woody',['turunç','odun','misk'],'Turunçların enerjisi, kuru odun ve temiz miskle dinamik bir günlük kokuya dönüşür.',4.2,'5–7 saat','Orta'],
  ['Khamrah','Gourmand Amber',['tarçın','hurma','pralin','vanilya'],'Tarçın, hurma ve pralin; vanilyalı amberin zengin, tatlı ve sarıcı hissini verir.',4.8,'10+ saat','Çok güçlü'],
  ['Layton','Fruity Amber',['elma','bergamot','vanilya'],'Çıtır elma ve bergamot, vanilyalı amberin yumuşak ama etkileyici gövdesine açılır.',4.7,'8–10 saat','Güçlü'],
  ['Ganymede','Mineral Leather',['safran','menekşe','deri'],'Safran ve menekşenin metalik-mineral yüzü, pürüzsüz deriyle avangart bir iz bırakır.',4.5,'10+ saat','Güçlü'],
  ['Marfa Memo','Floral Woody',['portakal çiçeği','tuberose','sandal'],'Portakal çiçeği ve tuberose, kremsi sandal ağacının güneşli beyaz çiçek etkisini taşır.',4.4,'7–9 saat','Orta'],
  ['Molecule 02','Molecular Musk',['ambroxan','mineral notalar','ten notası'],'Tek molekülün mineral ve tenle değişen, sade ama şaşırtıcı derecede çekici hali.',4.3,'6–10 saat','Tenine göre'],
  ['Arabian Tonka','Amber Woody',['tonka','oud','amber'],'Tonka ve amberin yoğun tatlılığı, oudun reçinemsi gövdesiyle zenginleşir.',4.6,'10+ saat','Çok güçlü'],
  ['Oud Maracuja','Fruity Oud',['passionfruit','gül','oud'],'Passionfruitin ekşi meyveliliği, gül ve oudun güçlü gövdesine canlılık verir.',4.5,'9–11 saat','Çok güçlü'],
  ['Oud Save The King','Woody Amber',['çay','oud','amber'],'Çayın kuru sakinliği, oud ve amberin asil derinliğiyle zarif bir oryantal yaratır.',4.5,'8–10 saat','Güçlü'],
  ['Part Of Lady','Floral Musk',['gül','misk','amber'],'Gülün şeffaf çiçekliliği, ten kokulu misk ve yumuşak amberle bütünleşir.',4.1,'5–7 saat','Orta'],
  ['Kirke','Fruity Musk',['şeftali','meyveler','misk'],'Şeftali ve egzotik meyveler, şekerli miskle parlak ve kalıcı bir meyveli aura oluşturur.',4.4,'8–10 saat','Güçlü'],
  ['Bitter Peach','Fruity Amber',['şeftali','rom','paçuli'],'Olgun şeftali ve romun likörlü etkisi, paçulinin kuru dokusuyla koyulaşır.',4.5,'7–9 saat','Güçlü'],
  ['Black Orchid','Floral Woody',['trüf','orkide','paçuli'],'Topraksı trüf, koyu orkide ve paçulinin dramatik, zamansız karışımı.',4.7,'9–11 saat','Güçlü'],
  ['Vanilla Sex','Amber Vanilla',['vanilya','bitter badem','odunsu notalar'],'Bitter bademle koyulaşan kremsi vanilya, kuru odunsu notalarla yetişkin bir gourmand olur.',4.4,'7–9 saat','Güçlü'],
  ['Torino 21','Green Citrus',['nane','limon','verbena'],'Nane, limon ve verbena ile buz gibi, yeşil ve enerjik bir açılış.',4.6,'5–7 saat','Orta'],
  ['Vanilla Powder','Musk Vanilla',['vanilya','misk','pudra'],'Vanilya ve pudranın yumuşaklığı, temiz miskle ten üzerinde sakinleşir.',4.3,'6–8 saat','Orta'],
  ['Erba Pura','Fruity Musk',['narenciye','meyve','misk'],'Narenciye ve tropikal meyvelerin parlaklığı, miskin ipeksi tabanında uzun süre kalır.',4.4,'8–10 saat','Güçlü'],
  ['Naxos','Amber Fougere',['bal','tütün','lavanta'],'Balın sıcak tatlılığı ve tütün, lavantanın aromatik temizliğiyle dengelenir.',4.8,'9–11 saat','Güçlü'],
  ['Ombre Nomade','Woody Oud',['oud','gül','ahududu'],'Oudun güçlü karanlığı, gül ve ahududunun meyveli dokusuyla parlatılır.',4.7,'10+ saat','Çok güçlü'],
  ['Huram Blanc','Special Blend',['amber','odun','misk'],'Arven’e özel parfüm karışımı: amberin sıcaklığı, odunun kuru dokusu ve ten miskinin yumuşak izi.',4.9,'8–10 saat','Güçlü']
].map((x,i)=>make(x[0],'Unisex',x[1],x[2],x[3],x[4],x[5],x[6],i+50))

export const perfumes = [...men, ...women, ...unisex]
export const categories = [
  { key: 'Tümü', label: 'Tüm parfümler', count: perfumes.length },
  { key: 'Erkek', label: 'Erkek', count: men.length },
  { key: 'Kadın', label: 'Kadın', count: women.length },
  { key: 'Unisex', label: 'Unisex', count: unisex.length }
]
