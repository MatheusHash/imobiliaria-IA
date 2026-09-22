import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PropertyDTO } from "@/lib/properties";
import { formatCurrency, propertyTypeLabel, transactionTypeLabel } from "@/lib/utils";

export function PropertyCard({ property }: { property: PropertyDTO }) {
  const image = property.images[0] ?? "/uploads/placeholder.svg";

  return (
    <Link href={`/imoveis/${property.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <Image
            src={image}
            alt={property.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={image.startsWith("/uploads/")}
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="bg-background/90">{propertyTypeLabel(property.type)}</Badge>
            <Badge className="bg-primary text-primary-foreground">{transactionTypeLabel(property.transactionType)}</Badge>
          </div>
        </div>
        <CardContent>
          <p className="text-lg font-bold text-foreground">{formatCurrency(property.price, property.transactionType)}</p>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold text-foreground">{property.title}</h3>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {property.city}, {property.neighborhood}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> {property.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {property.bathrooms}</span>
            <span className="flex items-center gap-1"><Ruler className="h-4 w-4" /> {property.area} m²</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
