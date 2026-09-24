import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './Header';
import { BackToTop } from '../BackToTop';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { MobileBottomTabs } from './MobileBottomTabs';
import { WhatsAppFAB } from './WhatsAppFAB';

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Header />
      <main style={{ paddingTop: 68 }}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <MobileBottomTabs />
      <WhatsAppFAB />
      <BackToTop />
    </>
  );
}
