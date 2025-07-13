<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="text-2xl font-bold text-gray-900">ZiPost</NuxtLink>
            <span class="ml-2 text-sm text-gray-500">Dashboard</span>
          </div>
          <div class="flex items-center space-x-4">
            <UDropdown :items="userMenuItems">
              <UButton variant="ghost" trailing-icon="i-heroicons-chevron-down-20-solid">
                {{ user?.email || 'User' }}
              </UButton>
            </UDropdown>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-2">Manage your API keys and monitor usage</p>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Total Requests</p>
                <p class="text-2xl font-semibold text-gray-900">{{ analytics.totalRequests.toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <UIcon name="i-heroicons-clock" class="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Avg Response Time</p>
                <p class="text-2xl font-semibold text-gray-900">{{ analytics.averageResponseTime }}ms</p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Error Rate</p>
                <p class="text-2xl font-semibold text-gray-900">{{ analytics.errorRate }}%</p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UIcon name="i-heroicons-key" class="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Active API Keys</p>
                <p class="text-2xl font-semibold text-gray-900">{{ activeApiKeys }}</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- API Keys Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- API Keys Management -->
        <div>
          <UCard>
            <template #header>
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold text-gray-900">API Keys</h2>
                <UButton @click="showCreateKeyModal = true">
                  <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
                  Create Key
                </UButton>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="key in apiKeys"
                :key="key.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <h3 class="font-medium text-gray-900">{{ key.name }}</h3>
                    <UBadge :color="key.isActive ? 'green' : 'red'" variant="soft">
                      {{ key.isActive ? 'Active' : 'Revoked' }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">
                    Created {{ formatDate(key.createdAt) }}
                  </p>
                  <p v-if="key.lastUsedAt" class="text-sm text-gray-500">
                    Last used {{ formatDate(key.lastUsedAt) }}
                  </p>
                </div>
                <div class="flex items-center space-x-2">
                  <UButton
                    v-if="key.isActive"
                    variant="ghost"
                    color="red"
                    size="sm"
                    @click="revokeKey(key.id)"
                  >
                    Revoke
                  </UButton>
                </div>
              </div>

              <div v-if="apiKeys.length === 0" class="text-center py-8 text-gray-500">
                No API keys yet. Create your first key to get started.
              </div>
            </div>
          </UCard>
        </div>

        <!-- Usage Analytics -->
        <div>
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900">Usage Analytics</h2>
            </template>

            <div class="space-y-6">
              <!-- Requests by Endpoint -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-3">Requests by Endpoint</h3>
                <div class="space-y-2">
                  <div
                    v-for="(count, endpoint) in analytics.requestsByEndpoint"
                    :key="endpoint"
                    class="flex justify-between items-center"
                  >
                    <span class="text-sm text-gray-600">{{ endpoint }}</span>
                    <span class="text-sm font-medium text-gray-900">{{ count.toLocaleString() }}</span>
                  </div>
                </div>
              </div>

              <!-- Status Code Distribution -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-3">Response Status Codes</h3>
                <div class="space-y-2">
                  <div
                    v-for="(count, status) in analytics.requestsByStatus"
                    :key="status"
                    class="flex justify-between items-center"
                  >
                    <div class="flex items-center space-x-2">
                      <UBadge
                        :color="getStatusColor(parseInt(status))"
                        variant="soft"
                        size="sm"
                      >
                        {{ status }}
                      </UBadge>
                    </div>
                    <span class="text-sm font-medium text-gray-900">{{ count.toLocaleString() }}</span>
                  </div>
                </div>
              </div>

              <!-- Rate Limit Info -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-3">Current Plan Limits</h3>
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Requests per minute</span>
                    <span class="text-sm font-medium text-gray-900">{{ currentPlan.requestsPerMinute }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600">Requests per day</span>
                    <span class="text-sm font-medium text-gray-900">{{ currentPlan.requestsPerDay }}</span>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Create API Key Modal -->
    <UModal v-model="showCreateKeyModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Create API Key</h3>
        </template>

        <UForm :state="createKeyForm" @submit="createApiKey">
          <UFormGroup label="Key Name" required>
            <UInput
              v-model="createKeyForm.name"
              placeholder="e.g., Production App, Development"
            />
          </UFormGroup>
        </UForm>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton variant="ghost" @click="showCreateKeyModal = false">
              Cancel
            </UButton>
            <UButton
              :loading="isCreatingKey"
              @click="createApiKey"
            >
              Create Key
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- API Key Created Modal -->
    <UModal v-model="showKeyCreatedModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-green-600">API Key Created</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600">
            Your API key has been created successfully. Please copy it now as it will not be shown again.
          </p>
          
          <UFormGroup label="API Key">
            <div class="flex space-x-2">
              <UInput
                :model-value="newApiKey"
                readonly
                class="flex-1"
              />
              <UButton
                variant="outline"
                @click="copyToClipboard(newApiKey)"
              >
                <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
              </UButton>
            </div>
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton @click="showKeyCreatedModal = false">
              Done
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

// Meta
useHead({
  title: 'Dashboard - ZiPost',
  meta: [
    { name: 'description', content: 'Manage your ZiPost API keys and monitor usage analytics.' }
  ]
})

// State
const user = ref({ email: 'user@example.com' })
const apiKeys = ref([])
const analytics = ref({
  totalRequests: 0,
  averageResponseTime: 0,
  errorRate: 0,
  requestsByEndpoint: {},
  requestsByStatus: {}
})
const showCreateKeyModal = ref(false)
const showKeyCreatedModal = ref(false)
const isCreatingKey = ref(false)
const newApiKey = ref('')

const createKeyForm = reactive({
  name: ''
})

const currentPlan = ref({
  requestsPerMinute: 100,
  requestsPerDay: 5000
})

// Computed
const activeApiKeys = computed(() => {
  return apiKeys.value.filter(key => key.isActive).length
})

const userMenuItems = computed(() => [
  [{
    label: 'Home',
    icon: 'i-heroicons-home',
    click: () => navigateTo('/')
  }],
  [{
    label: 'Sign Out',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: logout
  }]
])

// Methods
const loadDashboardData = async () => {
  // Mock data for demonstration
  apiKeys.value = [
    {
      id: '1',
      name: 'Production App',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      lastUsedAt: new Date('2024-01-20')
    },
    {
      id: '2',
      name: 'Development',
      isActive: true,
      createdAt: new Date('2024-01-10'),
      lastUsedAt: null
    }
  ]

  analytics.value = {
    totalRequests: 12543,
    averageResponseTime: 85,
    errorRate: 0.2,
    requestsByEndpoint: {
      '/api/autocomplete': 11200,
      '/api/analytics': 1343
    },
    requestsByStatus: {
      200: 12400,
      400: 120,
      401: 15,
      429: 8
    }
  }
}

const createApiKey = async () => {
  if (!createKeyForm.name.trim()) return
  
  isCreatingKey.value = true
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newKey = {
      id: Date.now().toString(),
      name: createKeyForm.name,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: null
    }
    
    apiKeys.value.push(newKey)
    newApiKey.value = `zp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    
    showCreateKeyModal.value = false
    showKeyCreatedModal.value = true
    
    // Reset form
    createKeyForm.name = ''
  } catch (error) {
    console.error('Error creating API key:', error)
  } finally {
    isCreatingKey.value = false
  }
}

const revokeKey = async (keyId) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const keyIndex = apiKeys.value.findIndex(key => key.id === keyId)
    if (keyIndex !== -1) {
      apiKeys.value[keyIndex].isActive = false
    }
  } catch (error) {
    console.error('Error revoking API key:', error)
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // You could show a toast notification here
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

const getStatusColor = (status) => {
  if (status >= 200 && status < 300) return 'green'
  if (status >= 300 && status < 400) return 'yellow'
  if (status >= 400 && status < 500) return 'orange'
  return 'red'
}

const logout = () => {
  navigateTo('/')
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>