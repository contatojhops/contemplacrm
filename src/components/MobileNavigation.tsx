import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { items } from './Sidebar';
import { featureEnabled } from '@/lib/features';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  return <Sheet open={open} onOpenChange={setOpen}>
    <Button className="lg:hidden shrink-0" variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
    <SheetContent side="left" className="bg-sidebar text-sidebar-foreground">
      <SheetHeader><SheetTitle className="text-sidebar-foreground">Consórcio CRM</SheetTitle></SheetHeader>
      <nav className="space-y-1 p-3">{items.filter(it => featureEnabled(it.to)).map(it => <Button key={it.to} variant="ghost" asChild className="w-full justify-start"><Link to={it.to} onClick={() => setOpen(false)}><it.icon className="h-4 w-4" />{it.label}</Link></Button>)}</nav>
    </SheetContent>
  </Sheet>;
}