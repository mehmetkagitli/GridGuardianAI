GridGuardian AI: Akıllı Şehir VPP Yönetim Sistemi
GridGuardian AI, geleceğin akıllı şehirlerinde elektrikli araç (EV) şarj yoğunluğunu yönetmek, trafo patlamalarını önlemek ve enerji dağıtımını optimize etmek için geliştirilmiş bir Sanal Güç Santrali (VPP) dashboard simülasyonudur.

Sistem; gerçek zamanlı veri analitiği, batarya destekli yük dengeleme ve yazılımsal yük kaydırma (Software-Defined Load Shifting) algoritmalarını kullanarak şebeke sürdürülebilirliğini sağlar.

Öne Çıkan Özellikler
Dinamik Yük Yönetimi: Trafoların kapasitesine göre (1600 kW) ev ve araç yüklerini anlık olarak dengeler.

BESS (Batarya Depolama) Desteği: Şebeke yükü %70'i (1120 kW) geçtiğinde bataryalar otomatik devreye girer.

Yazılımsal Yönlendirme: Kritik mahallelerde (Mahalle B) kapasite ve batarya doluluğu (%20 altı) yetersiz kaldığında, yeni gelen araçları otomatik olarak müsait mahallelere (Mahalle A/C) yönlendirir.

Güneş Enerjisi Entegrasyonu: Sistem boştayken bataryaları fotovoltaik (PV) simülasyonu ile doldurur.

Gelişmiş Veri Analitiği: 24 saatlik yük değişimi, BESS kullanım oranları ve anlık güç dağılımı grafiklerini sunar.


Teknik Yığın (Tech Stack)
Frontend: React.js, Tailwind CSS

Animasyon: Framer Motion (Araç geçişleri ve enerji akışları için)

Veri Görselleştirme: Recharts (Zaman serisi ve dağılım grafikleri)

Simülasyon Mantığı: Özel useEffect tabanlı gerçek zamanlı veri döngüsü.


Mahalle,Rol,Ev Sayısı,İstasyon Kapasitesi,Başlangıç BESS
Mahalle A,Güvenli Bölge,120,4 Araç,%100
Mahalle B,Kritik Bölge,80,6 Araç,%35 (Kritik)
Mahalle C,Destekleyici,100,4 Araç,%85


Test Senaryoları
Normal Senaryo: Şebeke yükü düşük, bataryalar güneşle doluyor.

Pik Yük Senaryosu: Şebeke baz yükü artar (Sarı mod). Bataryalar araç şarjı sırasında destek verir.

Kritik Yönlendirme: Mahalle B'de yük sınırı aşılır, batarya biter ve yazılım araçları otomatik kaydırır.