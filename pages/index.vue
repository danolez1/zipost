<template>
  <div class="min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">ZiPost</h1>
            <span class="ml-2 text-sm text-gray-500">Postal Code API</span>
          </div>
          <div class="flex items-center space-x-4">
            <UButton
              v-if="!isAuthenticated"
              variant="ghost"
              @click="showAuthModal = true"
            >
              Sign In
            </UButton>
            <UButton
              v-if="!isAuthenticated"
              @click="showAuthModal = true"
            >
              Get Started
            </UButton>
            <UDropdown
              v-if="isAuthenticated"
              :items="userMenuItems"
            >
              <UButton variant="ghost" trailing-icon="i-heroicons-chevron-down-20-solid">
                {{ user?.email }}
              </UButton>
            </UDropdown>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Fast & Accurate Postal Code API
        </h2>
        <p class="text-xl text-gray-600 mb-8">
          Get instant postal code autocomplete for Japan with our high-performance API
        </p>
      </div>

      <!-- Demo Section -->
      <div class="max-w-2xl mx-auto mb-16">
        <UCard class="p-8">
          <h3 class="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Try it out
          </h3>
          
          <div class="space-y-4">
            <UFormGroup label="Search postal codes, cities, or prefectures">
              <UInput
                v-model="searchQuery"
                placeholder="e.g., 100-0001, Tokyo, Shibuya..."
                size="lg"
                :loading="isSearching"
                @input="onSearchInput"
              />
            </UFormGroup>
            
            <div v-if="searchResults.length > 0" class="space-y-2">
              <div
                v-for="result in searchResults"
                :key="result.postalCode"
                class="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                @click="selectResult(result)"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-semibold text-gray-900">
                      {{ result.postalCode }}
                    </div>
                    <div class="text-gray-600">
                      {{ result.prefecture }} {{ result.city }} {{ result.town }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ result.kana }}
                    </div>
                  </div>
                  <UBadge color="blue" variant="soft">
                    {{ result.countryCode }}
                  </UBadge>
                </div>
              </div>
            </div>
            
            <div v-if="searchQuery && !isSearching && searchResults.length === 0" class="text-center py-8 text-gray-500">
              No results found. Try a different search term.
            </div>
          </div>
        </UCard>
      </div>

      <!-- Features Section -->
      <div class="grid md:grid-cols-3 gap-8 mb-16">
        <UCard>
          <div class="p-6 text-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-bolt" class="w-6 h-6 text-blue-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p class="text-gray-600">Sub-100ms response times with optimized database queries</p>
          </div>
        </UCard>
        
        <UCard>
          <div class="p-6 text-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Reliable & Secure</h3>
            <p class="text-gray-600">99.9% uptime with JWT authentication and rate limiting</p>
          </div>
        </UCard>
        
        <UCard>
          <div class="p-6 text-center">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-purple-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Detailed Analytics</h3>
            <p class="text-gray-600">Track usage, monitor performance, and manage API keys</p>
          </div>
        </UCard>
      </div>

      <!-- Pricing Section -->
      <div class="text-center mb-16">
        <h3 class="text-3xl font-bold text-gray-900 mb-8">Simple, Transparent Pricing</h3>
        
        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <UCard class="relative">
            <div class="p-8">
              <h4 class="text-xl font-semibold text-gray-900 mb-2">Free</h4>
              <div class="text-3xl font-bold text-gray-900 mb-4">$0<span class="text-lg text-gray-500">/month</span></div>
              <ul class="space-y-3 text-gray-600 mb-6">
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  100 requests/minute
                </li>
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  5,000 requests/day
                </li>
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  Basic support
                </li>
              </ul>
              <UButton block variant="outline">Get Started</UButton>
            </div>
          </UCard>
          
          <UCard class="relative border-2 border-blue-500">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <UBadge color="blue">Most Popular</UBadge>
            </div>
            <div class="p-8">
              <h4 class="text-xl font-semibold text-gray-900 mb-2">Basic</h4>
              <div class="text-3xl font-bold text-gray-900 mb-4">$29<span class="text-lg text-gray-500">/month</span></div>
              <ul class="space-y-3 text-gray-600 mb-6">
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  1,000 requests/minute
                </li>
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  50,000 requests/day
                </li>
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  Priority support
                </li>
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  Analytics dashboard
                </li>
              </ul>
              <UButton block>Get Started</UButton>
            </div>
          </UCard>
          
          <UCard class="relative">
            <div class="p-8">
              <h4 class="text-xl font-semibold text-gray-900 mb-2">Pro</h4>
              <div class="text-3xl font-bold text-gray-900 mb-4">$99<span class="text-lg text-gray-500">/month</span></div>
              <ul class="space-y-3 text-gray-600 mb-6">
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  Unlimited requests
                </li>
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  24/7 support
                </li>
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  Advanced analytics
                </li>
                <li class="flex items-center">
                  <UIcon name="i-heroicons-check" class="w-5 h-5 text-green-500 mr-2" />
                  Custom integrations
                </li>
              </ul>
              <UButton block variant="outline">Contact Sales</UButton>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Auth Modal -->
    <UModal v-model="showAuthModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ authMode === 'login' ? 'Sign In' : 'Create Account' }}</h3>
        </template>
        
        <UForm :state="authForm" @submit="handleAuth">
          <div class="space-y-4">
            <UFormGroup label="Email" required>
              <UInput v-model="authForm.email" type="email" placeholder="your@email.com" />
            </UFormGroup>
            
            <UFormGroup label="Password" required>
              <UInput v-model="authForm.password" type="password" placeholder="••••••••" />
            </UFormGroup>
          </div>
        </UForm>
        
        <template #footer>
          <div class="flex justify-between items-center">
            <UButton
              variant="ghost"
              @click="authMode = authMode === 'login' ? 'register' : 'login'"
            >
              {{ authMode === 'login' ? 'Need an account?' : 'Already have an account?' }}
            </UButton>
            
            <UButton
              :loading="isAuthenticating"
              @click="handleAuth"
            >
              {{ authMode === 'login' ? 'Sign In' : 'Create Account' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { debounce } from 'lodash-es'

// Meta
useHead({
  title: 'ZiPost - Postal Code API Service',
  meta: [
    { name: 'description', content: 'Fast and accurate postal code autocomplete API for Japan with high performance and reliability.' }
  ]
})

// State
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const showAuthModal = ref(false)
const authMode = ref('login')
const isAuthenticating = ref(false)
const isAuthenticated = ref(false)
const user = ref(null)

const authForm = reactive({
  email: '',
  password: ''
})

// Computed
const userMenuItems = computed(() => [
  [{
    label: 'Dashboard',
    icon: 'i-heroicons-chart-bar',
    click: () => navigateTo('/dashboard')
  }],
  [{
    label: 'Sign Out',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: logout
  }]
])

// Methods
const debouncedSearch = debounce(async (query) => {
  if (!query || query.length < 2) {
    searchResults.value = []
    return
  }
  
  isSearching.value = true
  
  try {
    // For demo purposes, we'll use mock data
    // In production, this would call the actual API
    const mockResults = [
      {
        postalCode: '100-0001',
        prefecture: 'Tokyo',
        city: 'Chiyoda',
        town: 'Chiyoda',
        kana: 'トウキョウト チヨダク チヨダ',
        countryCode: 'JP'
      },
      {
        postalCode: '150-0002',
        prefecture: 'Tokyo',
        city: 'Shibuya',
        town: 'Shibuya',
        kana: 'トウキョウト シブヤク シブヤ',
        countryCode: 'JP'
      }
    ]
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    searchResults.value = mockResults.filter(result => 
      result.postalCode.includes(query) ||
      result.prefecture.toLowerCase().includes(query.toLowerCase()) ||
      result.city.toLowerCase().includes(query.toLowerCase()) ||
      result.town.toLowerCase().includes(query.toLowerCase())
    )
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}, 300)

const onSearchInput = () => {
  debouncedSearch(searchQuery.value)
}

const selectResult = (result) => {
  searchQuery.value = `${result.postalCode} - ${result.prefecture} ${result.city} ${result.town}`
  searchResults.value = []
}

const handleAuth = async () => {
  if (!authForm.email || !authForm.password) return
  
  isAuthenticating.value = true
  
  try {
    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    user.value = { email: authForm.email }
    isAuthenticated.value = true
    showAuthModal.value = false
    
    // Reset form
    authForm.email = ''
    authForm.password = ''
  } catch (error) {
    console.error('Auth error:', error)
  } finally {
    isAuthenticating.value = false
  }
}

const logout = () => {
  user.value = null
  isAuthenticated.value = false
}
</script>