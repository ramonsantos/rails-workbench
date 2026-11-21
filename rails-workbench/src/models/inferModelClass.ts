import { classifyAssociationName } from '../schema/inflect';

/** Association symbol like `employees` or `employee_admin_roles` → `Employee`. */
export function inferModelClassFromSymbol(symbol: string): string {
	return classifyAssociationName(symbol);
}