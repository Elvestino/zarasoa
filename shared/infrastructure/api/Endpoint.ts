/**
 * Base des « endpoints » : chaque module déclare les routes qu'il appelle
 * (ex. AuthEndpoint) au lieu de disséminer des URL dans l'interface.
 */
export abstract class Endpoint {
  protected constructor(private readonly basePath: string) {}

  protected path(suffix = ""): string {
    return `${this.basePath}${suffix}`;
  }
}
