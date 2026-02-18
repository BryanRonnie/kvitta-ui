import { http, HttpResponse } from 'msw';

const API_BASE = 'https://kvitta-api-7d3pprqtaq-uc.a.run.app';

export const handlers = [
    // Auth endpoints
    http.post(`${API_BASE}/auth/login`, async ({ request }) => {
        const body = await request.json() as any;

        if (body.email === 'test@example.com' && body.password === 'password123') {
            return HttpResponse.json({
                access_token: 'mock-jwt-token-12345',
                user: {
                    email: 'test@example.com',
                    name: 'Test User',
                    created_at: '2024-01-01T00:00:00Z',
                },
            });
        }

        return HttpResponse.json(
            { detail: 'Invalid credentials' },
            { status: 401 }
        );
    }),

    http.post(`${API_BASE}/auth/signup`, async () => {
        return HttpResponse.json({
            access_token: 'mock-jwt-token-12345',
            user: {
                email: 'newuser@example.com',
                name: 'New User',
                created_at: '2024-01-01T00:00:00Z',
            },
        });
    }),

    http.get(`${API_BASE}/auth/me`, ({ request }) => {
        const authHeader = request.headers.get('Authorization');

        if (authHeader?.includes('mock-jwt-token')) {
            return HttpResponse.json({
                email: 'test@example.com',
                name: 'Test User',
                created_at: '2024-01-01T00:00:00Z',
            });
        }

        return HttpResponse.json(
            { detail: 'Unauthorized' },
            { status: 401 }
        );
    }),

    // Receipt endpoints
    http.get(`${API_BASE}/receipt/:id`, ({ params }) => {
        return HttpResponse.json({
            id: params.id,
            user_email: 'test@example.com',
            created_at: '2024-01-01T00:00:00Z',
            items_analysis: {
                line_items: [
                    {
                        description: 'Margherita Pizza',
                        total_price: 18.50,
                        quantity: 1,
                        index: 0,
                    },
                    {
                        description: 'Caesar Salad',
                        total_price: 12.00,
                        quantity: 2,
                        index: 1,
                    },
                ],
                total: 30.50,
                tax: 2.44,
                tip: 5.00,
            },
            split_details: {},
            status: 'completed',
        });
    }),

    http.patch(`${API_BASE}/receipts/:id/split`, async ({ request, params }) => {
        const body = await request.json() as any;

        return HttpResponse.json({
            id: params.id,
            split_details: body.split_map,
            status: 'completed',
        });
    }),

    // Groups endpoints
    http.get(`${API_BASE}/groups`, () => {
        return HttpResponse.json([
            {
                id: 'group-123',
                name: 'Weekend Trip',
                created_at: '2024-01-01T00:00:00Z',
                members: [
                    { email: 'alice@test.com', role: 'admin' },
                    { email: 'bob@test.com', role: 'member' },
                ],
            },
        ]);
    }),
];
