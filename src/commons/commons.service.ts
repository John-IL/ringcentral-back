import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonsService {

    paginate(items: any[], total: number, perPage: number, currentPage: number) {
        const totalResult = items.length > 0 ? total : items.length;
        const fromTo = ((currentPage - 1) * perPage + 1)
        const lastPage = Math.max(Math.ceil(total / perPage), 1);
        const to = currentPage * perPage;

        return {
            currentPage: currentPage,
            data: items,
            from: totalResult > 0 ? fromTo : 0,
            lastPage: lastPage,
            perPage: perPage,
            to: totalResult > to ? to : totalResult,
            total: totalResult
        }
    }
}
