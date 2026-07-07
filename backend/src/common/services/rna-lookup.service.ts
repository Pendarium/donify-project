import { Injectable } from '@nestjs/common';

@Injectable()
export class RnaLookupService {
  private readonly entrepriseBaseUrl =
    process.env.RNA_API_BASE_URL ||
    'https://entreprise.api.gouv.fr/v4/djepva/api-association/associations/open_data';
  private readonly entrepriseToken = process.env.RNA_API_TOKEN?.trim();
  private readonly publicSearchBaseUrl =
    process.env.RNA_PUBLIC_SEARCH_API_BASE_URL ||
    'https://recherche-entreprises.api.gouv.fr/search';

  private normalizeIdentifier(identifier: string) {
    return identifier.trim().toUpperCase().replace(/\s+/g, '');
  }

  private buildAddress(address?: {
    numero_voie?: string;
    type_voie?: string;
    libelle_voie?: string;
    distribution?: string;
    code_postal?: string;
    commune?: string;
  } | null) {
    if (!address) {
      return '';
    }

    return [
      address.numero_voie,
      address.type_voie,
      address.libelle_voie,
      address.distribution,
      address.code_postal,
      address.commune,
    ]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .join(' ')
      .trim();
  }

  private async fetchJson(url: string, init?: RequestInit) {
    const response = await fetch(url, init).catch(() => null);

    if (!response?.ok) {
      return null;
    }

    return response.json().catch(() => null);
  }

  private mapEntrepriseAssociation(data: any, fallbackIdentifier: string) {
    if (!data?.nom) {
      return null;
    }

    const headquarters =
      data.adresse_siege ||
      data.adresse_gestion ||
      data.etablissements?.[0]?.adresse;
    const address = this.buildAddress(headquarters);

    return {
      rnaNumber: data.rna || fallbackIdentifier,
      name: data.nom,
      description: data.activites?.objet || undefined,
      address: address || 'Adresse indisponible',
      email: data.etablissements?.[0]?.courriel || undefined,
      phone: data.etablissements?.[0]?.telephone || undefined,
    };
  }

  private mapPublicSearchAssociation(result: any, fallbackIdentifier: string) {
    const name = result?.nom_raison_sociale || result?.nom_complet;

    if (!name) {
      return null;
    }

    return {
      rnaNumber: result?.association?.id ?? fallbackIdentifier,
      name,
      description: undefined,
      address: result?.siege?.adresse || 'Adresse indisponible',
      email: undefined,
      phone: undefined,
    };
  }

  private async getAssociationFromEntrepriseApi(identifier: string) {
    const url = new URL(`${this.entrepriseBaseUrl}/${encodeURIComponent(identifier)}`);
    const headers: Record<string, string> = {};

    if (this.entrepriseToken) {
      url.searchParams.set('token', this.entrepriseToken);
      headers.Authorization = `Bearer ${this.entrepriseToken}`;
    }

    const body = await this.fetchJson(url.toString(), {
      headers,
    });

    return this.mapEntrepriseAssociation(body?.data, identifier);
  }

  private async getAssociationFromPublicSearch(identifier: string) {
    const url = new URL(this.publicSearchBaseUrl);
    url.searchParams.set('q', identifier);
    url.searchParams.set('per_page', '1');
    url.searchParams.set('est_association', 'true');

    const body = await this.fetchJson(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'donnify-rna-lookup',
      },
    });

    return this.mapPublicSearchAssociation(body?.results?.[0], identifier);
  }

  async getAssociationData(identifier: string): Promise<null | {
    rnaNumber: string;
    name: string;
    description?: string;
    address: string;
    email?: string;
    phone?: string;
  }> {
    const normalized = this.normalizeIdentifier(identifier);

    if (!normalized) {
      return null;
    }

    return (await this.getAssociationFromEntrepriseApi(normalized))
      || (await this.getAssociationFromPublicSearch(normalized));
  }

  async associationExists(identifier: string): Promise<boolean> {
    const data = await this.getAssociationData(identifier);
    return Boolean(data);
  }
}
