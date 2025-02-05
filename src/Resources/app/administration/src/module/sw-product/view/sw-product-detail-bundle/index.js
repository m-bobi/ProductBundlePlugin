import template from './sw-product-detail-bundle.html.twig';
const { Criteria } = Shopware.Data;
Shopware.Component.register('sw-product-detail-bundle', {
    template,

    inject: ['repositoryFactory'],

    data() {
        return {
            isLoading: false,
            selectedProduct: null,
            assignedProducts: []
        };
    },

    computed: {
        product() {
            return Shopware.State.get('swProductDetail').product;
        },

        bundleAssignedProductsRepository() {
            return this.repositoryFactory.create('product_bundle_assigned_products');
        }
    },

    created() {
        this.loadAssignedProducts();
    },

    methods: {
        async onProductSelect(productId) {

            if (!productId) {
                this.selectedProduct = null;
                return;
            }

            const productRepository = this.repositoryFactory.create('product');

            try {
                this.selectedProduct = await productRepository.get(productId, Shopware.Context.api);
            } catch (error) {
                console.error("Error fetching full product:", error);
                this.selectedProduct = null;
            }
        }
        ,

        async loadAssignedProducts() {
            if (!this.product?.id) {
                this.assignedProducts = [];
                return;
            }

            this.isLoading = true;

            try {
                const criteria = new Criteria()
                    .addFilter(
                        Criteria.equals('bundle.productId', this.product.id)
                    )
                    .addAssociation('product')
                    .addAssociation('bundle');

                this.assignedProducts = await this.bundleAssignedProductsRepository.search(
                    criteria,
                    Shopware.Context.api
                );

            } catch (error) {
                console.error('Load error:', error.response?.data || error);
                this.assignedProducts = [];
            } finally {
                this.isLoading = false;
            }
        },

        async onAddProduct() {
            if (!this.selectedProduct?.id) {
                console.error('[2] No product selected');
                return;
            }

            try {

                const bundle = await this.findOrCreateBundle();

                const assignment = this.bundleAssignedProductsRepository.create();
                assignment.bundleId = bundle.id;
                assignment.productId = this.selectedProduct.id;
                assignment.quantity = 1;


                await this.bundleAssignedProductsRepository.save(assignment, Shopware.Context.api);

                await this.loadAssignedProducts();
                this.selectedProduct = null;
            } catch (error) {
                console.error('[ERROR] Full error:', error);
                console.error('[ERROR] API response:', error.response?.data);
            }
        }
        ,


        async findOrCreateBundle() {

            const bundleRepo = this.repositoryFactory.create('product_bundle');
            const criteria = new Criteria().addFilter(Criteria.equals('productId', this.product.id));

            let bundleResult = await bundleRepo.search(criteria, Shopware.Context.api);
            console.log("Bundle search result:", bundleResult);

            if (bundleResult.total === 0) {
                let newBundle = bundleRepo.create();
                newBundle.productId = this.product.id;
                newBundle.name = `${this.product.name} Bundle`;

                await bundleRepo.save(newBundle, Shopware.Context.api);
                return newBundle;
            }

            return bundleResult.first();
        }
    }
});