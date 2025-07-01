class Node:
    def __init__(self, key):
        self.key = key          # Node value
        self.left = None        # Left child
        self.right = None       # Right child
        self.height = 1         # Height of node (needed for balancing)

class AVLTree:
    # Get the height of a node
    def get_height(self, root):
        if not root:
            return 0
        return root.height

    # Get balance factor of a node (left height - right height)
    def get_balance(self, root):
        if not root:
            return 0
        return self.get_height(root.left) - self.get_height(root.right)

    # Right rotate subtree rooted with z (for balancing)
    def right_rotate(self, z):
        y = z.left
        T3 = y.right

        # Perform rotation
        y.right = z
        z.left = T3

        # Update heights after rotation
        z.height = 1 + max(self.get_height(z.left), self.get_height(z.right))
        y.height = 1 + max(self.get_height(y.left), self.get_height(y.right))

        return y  # New root after rotation

    # Left rotate subtree rooted with z (for balancing)
    def left_rotate(self, z):
        y = z.right
        T2 = y.left

        # Perform rotation
        y.left = z
        z.right = T2

        # Update heights after rotation
        z.height = 1 + max(self.get_height(z.left), self.get_height(z.right))
        y.height = 1 + max(self.get_height(y.left), self.get_height(y.right))

        return y  # New root after rotation

    # (a) Insert node and balance AVL tree
    def insert(self, root, key):
        # 1. Normal BST insert
        if not root:
            return Node(key)

        if key < root.key:
            root.left = self.insert(root.left, key)
        else:
            root.right = self.insert(root.right, key)

        # 2. Update height of this ancestor node
        root.height = 1 + max(self.get_height(root.left), self.get_height(root.right))

        # 3. Get balance factor to check if unbalanced
        balance = self.get_balance(root)

        # 4. Balance the tree with rotations based on cases

        # Left Left Case
        if balance > 1 and key < root.left.key:
            return self.right_rotate(root)

        # Right Right Case
        if balance < -1 and key > root.right.key:
            return self.left_rotate(root)

        # Left Right Case
        if balance > 1 and key > root.left.key:
            root.left = self.left_rotate(root.left)
            return self.right_rotate(root)

        # Right Left Case
        if balance < -1 and key < root.right.key:
            root.right = self.right_rotate(root.right)
            return self.left_rotate(root)

        # Return the (unchanged) node pointer
        return root

    # (b) In-order traversal to display AVL tree in sorted order
    def inorder(self, root):
        if not root:
            return []
        return self.inorder(root.left) + [root.key] + self.inorder(root.right)

# Build AVL tree from given values
avl = AVLTree()
root_avl = None
values = [5, 2, 8, 1, 4, 3, 7, 6]

for val in values:
    root_avl = avl.insert(root_avl, val)

print("AVL In-order Traversal:", avl.inorder(root_avl))
