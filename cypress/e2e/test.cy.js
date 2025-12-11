describe('Items Application E2E Test', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('http://localhost:3000');
  });

  it('should load items page with pagination on first page', () => {
    // Assert items page is loaded
    cy.contains('Items', { timeout: 5000 }).should('be.visible');

    // Assert items are displayed
    cy.get('.items-list').should('exist');
    cy.get('.items-list__item').should('have.length.greaterThan', 0);

    // Assert we are on first page of pagination
    cy.get('nav.pagination').should('exist');
    cy.get('.pagination__btn.pagination__btn--active')
      .should('have.text', '1');

    // Assert previous button is disabled on first page
    cy.get('nav.pagination > .pagination__btn').first().should('be.disabled');
  });


  it('should navigate to item details when clicking on an item', () => {
    // Wait for items to load, ensure at least one item exists, then click the first item's link
    cy.get('.items-list__item', { timeout: 5000 }).should('have.length.greaterThan', 0);
    cy.get('.items-list__link', { timeout: 5000 })
      .first()
      .scrollIntoView({ block: 'center' })
      .then($el => {
        // Use a native DOM click to avoid Cypress visibility clipping issues
        $el[0].click();
      });

    // Wait for item details page to load
    cy.url().should('include', '/items/');

    // Assert item details component is loaded
    cy.get('.item-detail-card', { timeout: 5000 })
      .should('be.visible');

    // Assert necessary info is present
    cy.get('.item-detail-title').should('be.visible');
    cy.get('.item-detail-category').should('be.visible');
    cy.get('.item-detail-price').should('be.visible');

    // Assert back button exists
    cy.get('.item-detail-back').should('exist');
  });

  it('should navigate back to items list', () => {
    // Ensure there's an item and navigate to details using native click (avoid clipping issues)
    cy.get('.items-list__item', { timeout: 5000 }).should('have.length.greaterThan', 0);
    cy.get('.items-list__link', { timeout: 5000 })
      .first()
      .scrollIntoView({ block: 'center' })
      .then($el => {
        $el[0].click();
      });

    // Click back button
    cy.get('.item-detail-back').click();

    // Assert we're back on items page
    cy.url().should('eq', 'http://localhost:3000/');
    cy.get('.items-list').should('be.visible');
  });


  it('should paginate through items', () => {
    // Assert on first page
    cy.get('.pagination__btn.pagination__btn--active')
      .should('have.text', '1');

    // Click next page button (last pagination button)
    cy.get('nav.pagination > .pagination__btn').last().click();

    // Assert page changed
    cy.get('.pagination__btn.pagination__btn--active')
      .should('have.text', '2');

    // Assert items list updated
    cy.get('.items-list__item').should('have.length.greaterThan', 0);
  });
});
