<?php

namespace ProductBundle\Storefront\Subscriber;

use Shopware\Storefront\Page\Product\ProductPageCriteriaEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class ProductSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            ProductPageCriteriaEvent::class => 'onProductPageCriteria',
        ];
    }

    public function onProductPageCriteria(ProductPageCriteriaEvent $event): void
    {
        $criteria = $event->getCriteria();

        $criteria->addAssociation('bundleProducts.products');

    }
}

