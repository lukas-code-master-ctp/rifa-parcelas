export interface SiteConfig {
  countdown_datetime: string;
  progress_current:   number;
  progress_goal:      number;
  whatsapp_number:    string;
  sorteo_parcelas:    number;
  milestone_1:        number;
  milestone_2:        number;
  milestone_3:        number;
  milestone_4:        number;
  hero_imagen_url:    string;
  instagram_url:      string;
}

export interface Ebook {
  id:              string;
  titulo:          string;
  descripcion:     string;
  precio:          number;
  participaciones: number;
  imagen_url:      string;
  best_seller:     boolean;
}

export interface Parcela {
  id:          string;
  nombre:      string;
  proyecto:    string;
  ubicacion:   string;
  metraje:     string;
  precio:      string;
  estado:      'disponible' | 'bloqueada';
  imagen_url:  string;
  descripcion:       string;
  unlock_milestone:  number;
}

export interface OrderItem {
  id:              string;
  titulo:          string;
  precio:          number;
  participaciones: number;
  qty:             number;
}

export interface CartItem extends OrderItem {
  imagen_url?: string;
}

export interface TicketOrder {
  orderId:     string;
  nombre:      string;
  email:       string;
  total:       number;
  ticketCount: number;
  ticketCodes: string[];
  status:      string;
  timestamp:   string;
}
